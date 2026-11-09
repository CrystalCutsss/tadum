// Третья колонка сетки кабинета (01-cabinet-structure.md §9: на ≥1024 px экран занимает 2 из 3 колонок).
// Экран кладёт сюда блок через портал (`CabinetAside`): так оболочка не знает про конкретные виджеты (FSD).
// На узких экранах колонки нет — экран сам показывает блок в своей колонке.
import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface CabinetSlots {
  aside: HTMLElement | null;
  /** Заголовок экрана на всю ширину сетки: колонки под ним начинаются на одной высоте. */
  header: HTMLElement | null;
}

export const AsideSlotContext = createContext<CabinetSlots>({ aside: null, header: null });

export function CabinetAside({ children }: { children: ReactNode }) {
  const { aside } = useContext(AsideSlotContext);
  return aside ? createPortal(children, aside) : null;
}

/** Заголовок экрана над колонками: на ≥1024 px боковая колонка выравнивается по первому блоку контента. */
export function CabinetPageHeader({ children }: { children: ReactNode }) {
  const { header } = useContext(AsideSlotContext);
  return header ? createPortal(children, header) : null;
}
