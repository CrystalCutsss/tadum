// Проверка блока 6c: при VITE_DEMO_PANEL=0 (прод) кода демо-панели в сборке нет;
// в обычной сборке (dist, витрина) он есть — иначе проверка была бы пустой.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MARKER = 'data-demo-panel';

const jsFiles = (dir) => readdirSync(join(dir, 'assets')).filter((f) => f.endsWith('.js')).map((f) => join(dir, 'assets', f));
const withMarker = (dir) => jsFiles(dir).filter((f) => readFileSync(f, 'utf8').includes(MARKER));

const showcase = withMarker('dist');
if (showcase.length === 0) {
  console.error('✗ в dist (витрина) не найден код демо-панели — проверка была бы пустой; сначала pnpm build');
  process.exit(1);
}
console.log(`✓ витрина: демо-панель — отдельный чанк (${showcase.map((f) => f.split('/').pop()).join(', ')})`);

const out = mkdtempSync(join(tmpdir(), 'tadum-prod-'));
const build = spawnSync('pnpm', ['exec', 'vite', 'build', '--outDir', out, '--emptyOutDir'], {
  env: { ...process.env, VITE_DEMO_PANEL: '0' },
  stdio: ['ignore', 'ignore', 'pipe'],
  encoding: 'utf8',
});
if (build.status !== 0) {
  console.error('✗ сборка с VITE_DEMO_PANEL=0 не прошла');
  console.error(build.stderr);
  process.exit(1);
}
const prod = withMarker(out);
rmSync(out, { recursive: true, force: true });
if (prod.length > 0) {
  console.error(`✗ VITE_DEMO_PANEL=0: код демо-панели в сборке (${prod.map((f) => f.split('/').pop()).join(', ')})`);
  process.exit(1);
}
console.log('✓ VITE_DEMO_PANEL=0: кода демо-панели в сборке нет');
