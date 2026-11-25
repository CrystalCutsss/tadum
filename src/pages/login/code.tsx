// /login/code — auth.otp (SC-01). Гард: телефон введён на этом шаге (номер — только в памяти вкладки).
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { OtpForm } from '@/features/verify-otp';
import {
  SESSION_QUERY_KEY,
  authMemory,
  decideAuthScreen,
  destinationAfterLogin,
  familiesOf,
  familyMemory,
  loadSessionState,
  loginFlow,
} from '@/entities/session';
import { setAnalyticsContext, track } from '@/shared/analytics';
import { demoPersona, getApi, type Session } from '@/shared/api';
import { familyOfPath } from '@/shared/config';

import { AuthLayout } from '../-components/auth-layout';
import { SupportLink } from '../-components/support-link';
import { enforce, routeOf } from '../-guard';

/**
 * Демо (A-074): бэкенда регистрации поставщика нет, поэтому вход «как поставщик» — это персона мока `supplier_new`
 * (заявка поставщика, документы не загружены). Без демо (`VITE_DEMO_PANEL=0`) — обычная сессия.
 */
async function signInAsNewSupplier(fallback: Session): Promise<Session> {
  const api = await getApi();
  if (!api.demo) return fallback;
  api.demo.setPersona('supplier_new');
  demoPersona.set('supplier_new');
  return (await api.auth.getSession()) ?? fallback;
}

function CodePage() {
  const navigate = useNavigate();
  const router = useRouter();
  const pending = loginFlow.get();
  // Новый клиент отметил «Join as a supplier» (Кирилл 2026-11-25, A-074): после кода — сразу кабинет поставщика.
  // Запоминаем до проверки кода: после неё loginFlow очищается.
  const [joinAsSupplier] = useState(() => loginFlow.details()?.joinAsSupplier === true);
  if (!pending) return null;

  const onVerified = async (verified: Session) => {
    const session = joinAsSupplier ? await signInAsNewSupplier(verified) : verified;
    router.options.context.queryClient.setQueryData(SESSION_QUERY_KEY, session);
    const { to, returned } = destinationAfterLogin(session, authMemory.returnTo(), familyMemory.last());
    const family = familyOfPath(to) ?? 'client';
    familyMemory.remember(family);
    setAnalyticsContext({ role: family });
    track('auth_login_succeeded', {
      role_count: familiesOf(session.roles).length > 1 ? 2 : 1,
      active_role: family,
      returned_to: returned,
      first_login: !authMemory.loggedInBefore(),
      from_landing: authMemory.source() === 'landing',
    });
    authMemory.markLoggedIn();
    authMemory.clearReturnTo();
    const target = routeOf(to);
    void navigate({ to: target.to as '/', search: target.search as never, replace: true });
  };

  return (
    <AuthLayout>
      <OtpForm
        pending={pending}
        onVerified={(session) => void onVerified(session)}
        onUnknown={() => void navigate({ to: '/not-found', replace: true })}
        onChangePhone={() => {
          loginFlow.changePhone();
          void navigate({ to: '/login' });
        }}
        supportSlot={<SupportLink context="error" />}
      />
    </AuthLayout>
  );
}

export const Route = createFileRoute('/login/code')({
  beforeLoad: async ({ context }) => {
    enforce(decideAuthScreen(await loadSessionState(context.queryClient), familyMemory.last()));
    if (!loginFlow.get()) enforce({ kind: 'redirect', to: '/login' });
  },
  component: CodePage,
});
