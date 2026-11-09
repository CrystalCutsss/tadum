// Третья колонка сетки кабинета (01-cabinet-structure.md §9: на ≥1024 px экран занимает 2 из 3 колонок).
// Экран кладёт сюда блок через портал (`CabinetAside`): так оболочка не знает про конкретные виджеты (FSD).
// На узких экранах колонки нет — экран сам показывает блок в своей колонке.
import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const AsideSlotContext = createContext<HTMLElement | null>(null);

export function CabinetAside({ children }: { children: ReactNode }) {
  const slot = useContext(AsideSlotContext);
  return slot ? createPortal(children, slot) : null;
}
