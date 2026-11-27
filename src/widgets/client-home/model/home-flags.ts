// Локальные флаги главной (бриф TD-002 §5): карточка первого визита закрыта, блок шагов свёрнут.
// Через shared/lib/storage, без PII; ключ — по id лимита, чтобы новая активация (и другая персона мока) начинала заново.
import { storage } from '@/shared/lib';

const WELCOME = 'home:welcome_dismissed:';
const HOW_TO_BUY = 'home:how_to_buy_collapsed';

export const homeFlags = {
  welcomeDismissed: (limitId: string): boolean => storage.get(WELCOME + limitId) === '1',
  dismissWelcome: (limitId: string): void => storage.set(WELCOME + limitId, '1'),
  howToBuyCollapsed: (): boolean => storage.get(HOW_TO_BUY) === '1',
  setHowToBuyCollapsed: (collapsed: boolean): void => (collapsed ? storage.set(HOW_TO_BUY, '1') : storage.remove(HOW_TO_BUY)),
};
