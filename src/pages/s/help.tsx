// /s/help — помощь и настройки (SC-10).
import { createFileRoute } from '@tanstack/react-router';

import { HelpScreen } from '../-components/help-screen';

export const Route = createFileRoute('/s/help')({ component: HelpScreen });
