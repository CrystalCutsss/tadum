// /session-expired — auth.expired (SC-01 A11, SC-10).
import { createFileRoute } from '@tanstack/react-router';

import { SessionExpiredScreen } from './-components/session-expired-screen';

export const Route = createFileRoute('/session-expired')({ component: SessionExpiredScreen });
