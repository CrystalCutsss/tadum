// Тесты хуков Claude Code (мастер-промпт 8b.1): JSON на stdin → решение хука.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const hook = (name: string) => join(root, 'scripts/hooks', name);

function run(name: string, input: unknown, env: Record<string, string> = {}) {
  const r = spawnSync(hook(name), {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root, TADUM_ALLOW_PROTECTED: '', TADUM_DOCS_SYNC: '', ...env },
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

const decision = (stdout: string): string | undefined =>
  stdout.trim() ? (JSON.parse(stdout) as { hookSpecificOutput: { permissionDecision: string } }).hookSpecificOutput.permissionDecision : undefined;

const edit = (file: string, agent?: string) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Edit',
  tool_input: { file_path: join(root, file) },
  ...(agent ? { agent_type: agent } : {}),
});

describe('protect-paths.sh', () => {
  it.each(['src/styles/tokens.css', 'src/shared/ui/button.tsx', 'src/shared/api/ports/ports.ts', 'pnpm-lock.yaml', '.github/workflows/ci.yml', '.gitlab-ci.yml', 'wrangler.jsonc', '.claude/settings.json', 'docs/product/01-roles.md', 'tov-lexicon.json'])(
    'запрещает %s',
    (file) => {
      expect(decision(run('protect-paths.sh', edit(file)).stdout)).toBe('deny');
    },
  );

  it('разрешает обычные файлы', () => {
    expect(decision(run('protect-paths.sh', edit('src/features/logout/ui/logout-button.tsx')).stdout)).toBeUndefined();
  });

  it('design-system-owner правит токены и shared/ui, но не порты', () => {
    expect(decision(run('protect-paths.sh', edit('src/styles/tokens.css', 'design-system-owner')).stdout)).toBeUndefined();
    expect(decision(run('protect-paths.sh', edit('src/shared/ui/button.tsx', 'design-system-owner')).stdout)).toBeUndefined();
    expect(decision(run('protect-paths.sh', edit('src/shared/api/ports/ports.ts', 'design-system-owner')).stdout)).toBe('deny');
  });

  it('TADUM_ALLOW_PROTECTED=1 открывает защищённые пути, кроме снимка Drive', () => {
    const env = { TADUM_ALLOW_PROTECTED: '1' };
    expect(decision(run('protect-paths.sh', edit('src/styles/tokens.css'), env).stdout)).toBeUndefined();
    expect(decision(run('protect-paths.sh', edit('.github/workflows/ci.yml'), env).stdout)).toBeUndefined();
    expect(decision(run('protect-paths.sh', edit('docs/product/01-roles.md'), env).stdout)).toBe('deny');
  });

  it('TADUM_DOCS_SYNC=1 открывает docs/product и tov-lexicon.json', () => {
    const env = { TADUM_DOCS_SYNC: '1' };
    expect(decision(run('protect-paths.sh', edit('docs/product/01-roles.md'), env).stdout)).toBeUndefined();
    expect(decision(run('protect-paths.sh', edit('tov-lexicon.json'), env).stdout)).toBeUndefined();
  });

  it('путь нормализуется: ../ и ./ не обходят защиту', () => {
    const tricky = { ...edit('x'), tool_input: { file_path: join(root, 'src/features/../styles/./tokens.css') } };
    expect(decision(run('protect-paths.sh', tricky).stdout)).toBe('deny');
  });

  it('ux-writer правит только тексты', () => {
    expect(decision(run('protect-paths.sh', edit('src/shared/i18n/locales/ar.json', 'ux-writer')).stdout)).toBeUndefined();
    expect(decision(run('protect-paths.sh', edit('src/app/main.tsx', 'ux-writer')).stdout)).toBe('deny');
  });

  it('NotebookEdit и файлы вне проекта', () => {
    expect(decision(run('protect-paths.sh', { tool_name: 'NotebookEdit', tool_input: { notebook_path: join(root, 'src/shared/ui/x.ipynb') } }).stdout)).toBe('deny');
    expect(decision(run('protect-paths.sh', { tool_name: 'Write', tool_input: { file_path: '/tmp/other/tokens.css' } }).stdout)).toBeUndefined();
  });
});

const bash = (command: string, agent?: string) => ({ tool_name: 'Bash', tool_input: { command }, ...(agent ? { agent_type: agent } : {}) });

describe('guard-bash.sh', () => {
  it.each([
    'git push --force origin chore/x',
    'git push -f origin feat/y',
    'git push --force-with-lease',
    'git push origin main',
    'git push origin HEAD:main',
    'git -C /tmp/proto push origin main',
    'pnpm build && git push origin main',
    'rm -rf src',
    'rm -rf /',
    'rm -rf node_modules/.cache/../../src',
    'rm -r -f docs',
    'wrangler secret put PROTOTYPE_PASSWORDS',
    'pnpm exec wrangler secret list',
    'gh secret set CLOUDFLARE_API_TOKEN',
    'wrangler deploy',
    'pnpm exec wrangler deploy',
    'pnpm release:proto v1',
    'pnpm dlx shadcn@latest add button',
  ])('запрещает: %s', (command) => {
    expect(decision(run('guard-bash.sh', bash(command)).stdout)).toBe('deny');
  });

  it.each([
    'git push -u origin chore/setup-2',
    'git push origin feat/main-menu',
    'git status',
    'rm -rf dist node_modules storybook-static',
    'rm -rf ./test-results',
    'rm file.txt',
    'pnpm exec wrangler deploy --dry-run',
    'pnpm run deploy:preview',
    'pnpm run release:proto v1',
    'pnpm verify',
  ])('пропускает: %s', (command) => {
    expect(decision(run('guard-bash.sh', bash(command)).stdout)).toBeUndefined();
  });

  it('shadcn add — только design-system-owner', () => {
    expect(decision(run('guard-bash.sh', bash('pnpm dlx shadcn@latest add dialog', 'design-system-owner')).stdout)).toBeUndefined();
  });

  it('git commit запрещён на ветке main', () => {
    const repo = mkdtempSync(join(tmpdir(), 'tadum-hook-'));
    execFileSync('git', ['init', '-q', '-b', 'main', repo]);
    expect(decision(run('guard-bash.sh', bash('git commit -m "x"'), { CLAUDE_PROJECT_DIR: repo }).stdout)).toBe('deny');
    execFileSync('git', ['-C', repo, 'switch', '-q', '-c', 'feat/x']);
    expect(decision(run('guard-bash.sh', bash('git commit -m "x"'), { CLAUDE_PROJECT_DIR: repo }).stdout)).toBeUndefined();
  });
});

describe('verify-on-stop.sh', () => {
  it('повторный вызов (stop_hook_active) не запускает verify', () => {
    expect(run('verify-on-stop.sh', { stop_hook_active: true })).toMatchObject({ code: 0, stdout: '' });
  });

  it('без изменений в src/ не запускает verify', () => {
    const repo = mkdtempSync(join(tmpdir(), 'tadum-stop-'));
    execFileSync('git', ['init', '-q', repo]);
    expect(run('verify-on-stop.sh', { stop_hook_active: false }, { CLAUDE_PROJECT_DIR: repo })).toMatchObject({ code: 0, stdout: '' });
  });
});

describe('session-start.sh и prompt-brief.sh', () => {
  it('SessionStart выводит инварианты из CLAUDE.md', () => {
    const { stdout } = run('session-start.sh', { source: 'startup' });
    expect(stdout).toContain('Секреты ставит только Кирилл');
    expect(stdout.match(/^\d+\. /gm)).toHaveLength(12);
  });

  it('TD-### в промпте — напоминание о брифе', () => {
    expect(run('prompt-brief.sh', { prompt: 'Сделай TD-012' }).stdout).toContain('TD-012');
    expect(run('prompt-brief.sh', { prompt: 'Привет' }).stdout).toBe('');
  });
});
