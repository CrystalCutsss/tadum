// Демо-панель витрины (01-cabinet-structure.md §2, мастер-промпт 6c): персона, язык, тема, сеть, демо-действия,
// лента событий аналитики и ссылка с ?persona=&lang=. Подключается динамическим импортом и только при
// VITE_DEMO_PANEL ≠ 0: в продовую сборку не попадает. Пользователи её не видят — это пульт для показа и проверки.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { familiesOf, sessionQuery } from '@/entities/session';
import { useSwitchLanguage } from '@/features/switch-language';
import { useSwitchTheme } from '@/features/switch-theme';
import { demoFeed } from '@/shared/analytics';
import { DomainError, PERSONA_IDS, demoPersona, getApi, type NetworkMode } from '@/shared/api';
import { network } from '@/shared/lib';
import { Button, Input, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, ToggleGroup, ToggleGroupItem, toast } from '@/shared/ui';

import { DEMO_ACTIONS } from '../model/actions';

const NETWORK: readonly NetworkMode[] = ['ok', 'slow', 'error', 'offline'];
const THEMES = ['system', 'light', 'dark'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t pt-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

export function DemoPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { language, other, switchTo } = useSwitchLanguage();
  const { choice, choose } = useSwitchTheme();
  const session = useQuery(sessionQuery);
  const [persona, setPersona] = useState(() => demoPersona.get() ?? '');
  const [mode, setMode] = useState<NetworkMode>('ok');
  const [filter, setFilter] = useState('');
  const feed = useSyncExternalStore(demoFeed.subscribe, demoFeed.getSnapshot);
  const families = familiesOf(session.data?.roles ?? []);
  const actions = DEMO_ACTIONS.filter((a) => a.family === 'any' || families.includes(a.family));
  const shown = useMemo(() => feed.filter((e) => e.name.includes(filter)).slice(0, 50), [feed, filter]);

  const refresh = async () => {
    await queryClient.invalidateQueries();
  };

  const choosePersona = async (id: string) => {
    const api = await getApi();
    api.demo?.setPersona(id);
    demoPersona.set(id);
    setPersona(id);
    const url = new URL(window.location.href);
    url.searchParams.set('persona', id);
    window.history.replaceState(window.history.state, '', url);
    queryClient.clear();
    await navigate({ to: '/', replace: true });
  };

  const chooseNetwork = async (next: NetworkMode) => {
    (await getApi()).demo?.setNetwork(next);
    network.simulateOffline(next === 'offline');
    setMode(next);
  };

  const run = async (spec: (typeof DEMO_ACTIONS)[number]) => {
    try {
      await spec.run(await getApi());
      // После expireSession любой перезапрос получит 401 — приложение само уйдёт на /session-expired.
      await refresh();
    } catch (e) {
      toast(t('demo.action_failed', { code: e instanceof DomainError ? e.code : e instanceof Error ? e.message : 'error' }));
    }
  };

  const shareLink = () => {
    const url = new URL(window.location.href);
    if (persona) url.searchParams.set('persona', persona);
    url.searchParams.set('lang', language);
    void navigator.clipboard?.writeText(url.toString()).then(() => toast(t('demo.copied')));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {/* Над кнопкой меню оболочки Proto (16 px от края + 48 px кнопка + отступ; Кирилл 2026-11-06, A-056). */}
        <Button data-demo-panel variant="secondary" className="fixed end-4 bottom-20 z-50 min-h-11 shadow-md">
          {t('demo.open')}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-3 overflow-y-auto p-4 sm:max-w-md">
        <SheetHeader className="p-0">
          <SheetTitle>{t('demo.title')}</SheetTitle>
          <SheetDescription>{t('demo.description')}</SheetDescription>
        </SheetHeader>

        <Section title={t('demo.persona')}>
          <select
            aria-label={t('demo.persona')}
            value={persona}
            onChange={(e) => void choosePersona(e.target.value)}
            className="min-h-11 rounded-md border bg-background px-3 text-sm"
          >
            <option value="" disabled>
              —
            </option>
            {PERSONA_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={shareLink}>
            {t('demo.copy_link')}
          </Button>
        </Section>

        <Section title={t('help.language')}>
          <Button variant="outline" lang={other} onClick={() => switchTo(other)}>
            {t(other === 'en' ? 'lang.switch_to_en' : 'lang.switch_to_ar')}
          </Button>
        </Section>

        <Section title={t('help.theme')}>
          <ToggleGroup type="single" variant="outline" value={choice} onValueChange={(v) => v && choose(v as typeof choice)}>
            {THEMES.map((c) => (
              <ToggleGroupItem key={c} value={c} className="min-h-11">
                {t(`theme.${c}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section title={t('demo.network')}>
          <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => v && void chooseNetwork(v as NetworkMode)}>
            {NETWORK.map((n) => (
              <ToggleGroupItem key={n} value={n} className="min-h-11">
                {t(`demo.network_mode.${n}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section title={t('demo.actions')}>
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button key={a.id} size="sm" variant="outline" dir="ltr" onClick={() => void run(a)}>
                {a.id}
              </Button>
            ))}
          </div>
        </Section>

        <Section title={t('demo.events')}>
          <div className="flex gap-2">
            <Input dir="ltr" aria-label={t('demo.filter')} placeholder={t('demo.filter')} value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Button variant="outline" onClick={() => void navigator.clipboard?.writeText(JSON.stringify(shown, null, 2)).then(() => toast(t('demo.copied')))}>
              {t('demo.copy_json')}
            </Button>
            <Button variant="ghost" onClick={() => demoFeed.clear()}>
              {t('demo.clear')}
            </Button>
          </div>
          <ol dir="ltr" className="flex flex-col gap-1 text-xs">
            {shown.map((e) => (
              <li key={e.seq} className="rounded border px-2 py-1">
                <span className="font-medium">{e.name}</span> <code className="break-all text-muted-foreground">{JSON.stringify(e.props)}</code>
              </li>
            ))}
          </ol>
        </Section>
      </SheetContent>
    </Sheet>
  );
}
