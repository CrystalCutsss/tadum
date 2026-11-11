// Движение папки документов на пружинах.
//
// Адаптировано из компонента «Folder» React Bits (https://reactbits.dev, режим flap): интегратор пружины
// (жёсткость omega, затухание zeta, фиксированный шаг 1/240 с), коэффициенты наклона за указателем
// (rx = −y·8·tilt, ry = x·10·tilt), «подглядывание» листов при наведении (подъём, разлёт, поворот ×1.6, лист
// ближе к указателю поднимается выше) и ступенчатая задержка листов. Отгибание передней стенки не взято: ломает размытие.
// Лицензия React Bits — MIT + Commons Clause (по данным на 2026-11-11; текст лицензии в этой сессии не сверяли —
// A-063). Взято только движение: внешний вид папки — наш (documents-folder.tsx), WebGL-стекло не переносили.
//
// Положения пишутся прямо в style.transform через ref — без перерисовки React. Наклон считается по статичной
// обёртке (она не трансформируется), поэтому не дрожит. Контейнер папки — отдельный слой композитора
// (transform-gpu, will-change-transform): масштаб и наклон не перерисовывают размытие стекла.
// При prefers-reduced-motion — без анимации: поза ставится сразу, без наклона.

const TAU = Math.PI * 2;
const STEP = 1 / 240;
/** Параметры образца: bounce 0.4, speed 1, tilt 0.5. */
const BOUNCE = 0.4;
const SPEED = 1;
const TILT = 0.5;
const ZETA = 1 - 0.72 * BOUNCE;
const ITEM_OMEGA = TAU * 2.1 * SPEED;
const SOFT_OMEGA = TAU * 1.6 * SPEED;
/** Ступенька задержки листов при смене фазы, с. */
const STAGGER = 0.045 / SPEED;

/** Поза папки: увеличение на наведении (наш вид — 5 %), сжатие при нажатии, перспектива наклона. */
const HOVER_SCALE = 0.05;
const PRESS_SCALE = 0.975;
const TILT_PERSPECTIVE = 800;

/** Листы: наклон в покое и при наведении (наш вид: 6° и 12°), разлёт и подъём в px. */
const PAPER_REST_TURN = 6;
const PAPER_PEEK_TURN = 12;
const PAPER_SPREAD = 8;
const PAPER_RISE = 8;
const PAPER_NEAR_RISE = 6;
/** Центры листов по горизонтали в долях ширины папки (−1…1) для «ближе к указателю» в LTR. */
const PAPER_CENTERS = [-0.15, 0.15];

interface Spring {
  value: number;
  velocity: number;
}

const spring = (value: number): Spring => ({ value, velocity: 0 });

function snap(item: Spring, value: number) {
  item.value = value;
  item.velocity = 0;
}

/** Шаг пружины — как в образце: явный Эйлер с подшагами 1/240 с. Возвращает true, пока пружина не успокоилась. */
function integrate(item: Spring, target: number, omega: number, zeta: number, dt: number): boolean {
  const k = omega * omega;
  const d = 2 * zeta * omega;
  const steps = Math.max(1, Math.ceil(dt / STEP));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    item.velocity += (k * (target - item.value) - d * item.velocity) * step;
    item.value += item.velocity * step;
  }
  if (Math.abs(target - item.value) > 0.01 || Math.abs(item.velocity) > 0.01) return true;
  // Успокоилась — ставим точно в цель, чтобы в покое не оставались доли градуса.
  snap(item, target);
  return false;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface FolderMotionNodes {
  /** Кнопка-карточка: на ней слушаются указатель и фокус. */
  trigger: HTMLElement;
  /** Статичная обёртка папки: по ней считается положение указателя. */
  area: HTMLElement;
  /** Контейнер папки: масштаб и наклон. */
  folder: HTMLElement;
  /** Листы в порядке «у начала строки», «у конца строки». */
  papers: HTMLElement[];
}

interface PaperState {
  node: HTMLElement;
  x: Spring;
  y: Spring;
  r: Spring;
}

/**
 * Запускает движение папки и возвращает функцию очистки. `rtl` зеркалит разлёт и наклон листов
 * (лист у начала строки — справа).
 */
export function startFolderMotion(nodes: FolderMotionNodes, rtl: boolean): () => void {
  const { trigger, area, folder, papers } = nodes;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = media.matches;
  /** Направление «наружу» для листа у начала строки: в LTR — влево (−1), в RTL — вправо (+1). */
  const outward = rtl ? 1 : -1;

  const state = {
    hovered: false,
    focused: false,
    tracking: false,
    pressed: false,
    pointerX: 0,
    pointerY: 0,
    peekSince: 0,
    peekPrevious: false,
    peekNow: false,
    raf: 0,
    last: 0,
    lift: spring(0),
    squash: spring(1),
    rx: spring(0),
    ry: spring(0),
  };
  const restTurn = (index: number) => (index === 0 ? outward : -outward) * PAPER_REST_TURN;
  const paperStates: PaperState[] = papers.map((node, index) => ({
    node,
    x: spring(0),
    y: spring(0),
    r: spring(restTurn(index)),
  }));

  const write = () => {
    const scale = (1 + state.lift.value * HOVER_SCALE) * state.squash.value;
    folder.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${state.rx.value.toFixed(3)}deg) rotateY(${state.ry.value.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    paperStates.forEach((paper) => {
      paper.node.style.transform = `translate3d(${paper.x.value.toFixed(2)}px, ${paper.y.value.toFixed(2)}px, 0) rotate(${paper.r.value.toFixed(3)}deg)`;
    });
  };

  const paperTarget = (index: number, peek: boolean) => {
    const side = index === 0 ? outward : -outward;
    if (!peek) return { x: 0, y: 0, r: restTurn(index) };
    const center = (PAPER_CENTERS[index] ?? 0) * (rtl ? -1 : 1);
    const near = state.tracking ? Math.max(0, 1 - Math.abs(state.pointerX - center) / 0.64) : 0;
    return {
      x: side * PAPER_SPREAD,
      y: -PAPER_RISE - near * near * PAPER_NEAR_RISE,
      r: side * PAPER_PEEK_TURN,
    };
  };

  const frame = (now: number) => {
    state.raf = 0;
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now;
    const peek = state.hovered || state.focused;
    if (peek !== state.peekNow) {
      state.peekPrevious = state.peekNow;
      state.peekNow = peek;
      state.peekSince = now;
    }
    const elapsed = (now - state.peekSince) / 1000;
    const tilting = state.tracking;
    let busy = false;
    busy = integrate(state.rx, tilting ? -state.pointerY * 8 * TILT : 0, SOFT_OMEGA, 1, dt) || busy;
    busy = integrate(state.ry, tilting ? state.pointerX * 10 * TILT : 0, SOFT_OMEGA, 1, dt) || busy;
    busy = integrate(state.lift, peek ? 1 : 0, SOFT_OMEGA, 1, dt) || busy;
    busy = integrate(state.squash, state.pressed ? PRESS_SCALE : 1, TAU * 3.2, 0.6, dt) || busy;
    paperStates.forEach((paper, index) => {
      // Листы трогаются по очереди: пока задержка не прошла, лист держит прежнюю фазу.
      const delay = index * STAGGER;
      const active = elapsed >= delay ? peek : state.peekPrevious;
      if (elapsed < delay) busy = true;
      const target = paperTarget(index, active);
      busy = integrate(paper.x, target.x, ITEM_OMEGA, ZETA, dt) || busy;
      busy = integrate(paper.y, target.y, ITEM_OMEGA, ZETA, dt) || busy;
      busy = integrate(paper.r, target.r, ITEM_OMEGA, ZETA, dt) || busy;
    });
    write();
    if (busy) state.raf = requestAnimationFrame(frame);
    else state.last = 0;
  };

  /** Без анимации: сразу конечная поза, без наклона и сжатия. */
  const settle = () => {
    const peek = state.hovered || state.focused;
    state.peekNow = peek;
    state.peekPrevious = peek;
    snap(state.rx, 0);
    snap(state.ry, 0);
    snap(state.squash, 1);
    snap(state.lift, peek ? 1 : 0);
    paperStates.forEach((paper, index) => {
      const target = paperTarget(index, peek);
      snap(paper.x, target.x);
      snap(paper.y, target.y);
      snap(paper.r, target.r);
    });
    write();
  };

  const wake = () => {
    if (reduce) {
      settle();
      return;
    }
    if (!state.raf) state.raf = requestAnimationFrame(frame);
  };

  const measure = (event: PointerEvent) => {
    const box = area.getBoundingClientRect();
    if (!box.width || !box.height) return;
    state.pointerX = clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1, 1);
    state.pointerY = clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1, 1);
  };

  // Наклон — только за мышью и пером; на касании папка лишь «подглядывает» и возвращается.
  const onEnter = (event: PointerEvent) => {
    state.hovered = true;
    state.tracking = event.pointerType !== 'touch' && !reduce;
    measure(event);
    wake();
  };
  const onMove = (event: PointerEvent) => {
    if (!state.hovered) {
      onEnter(event);
      return;
    }
    measure(event);
    wake();
  };
  const onLeave = () => {
    state.hovered = false;
    state.tracking = false;
    state.pressed = false;
    wake();
  };
  const onDown = () => {
    state.pressed = true;
    wake();
  };
  const onUp = () => {
    state.pressed = false;
    wake();
  };
  // Фокус с клавиатуры показывает те же листы, что и наведение.
  const onFocus = () => {
    state.focused = trigger.matches(':focus-visible');
    wake();
  };
  const onBlur = () => {
    state.focused = false;
    wake();
  };
  const onMedia = () => {
    reduce = media.matches;
    if (reduce) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.tracking = false;
    }
    wake();
  };

  trigger.addEventListener('pointerenter', onEnter);
  trigger.addEventListener('pointermove', onMove);
  trigger.addEventListener('pointerleave', onLeave);
  trigger.addEventListener('pointercancel', onLeave);
  trigger.addEventListener('pointerdown', onDown);
  trigger.addEventListener('pointerup', onUp);
  trigger.addEventListener('focus', onFocus);
  trigger.addEventListener('blur', onBlur);
  media.addEventListener('change', onMedia);
  write();

  return () => {
    cancelAnimationFrame(state.raf);
    trigger.removeEventListener('pointerenter', onEnter);
    trigger.removeEventListener('pointermove', onMove);
    trigger.removeEventListener('pointerleave', onLeave);
    trigger.removeEventListener('pointercancel', onLeave);
    trigger.removeEventListener('pointerdown', onDown);
    trigger.removeEventListener('pointerup', onUp);
    trigger.removeEventListener('focus', onFocus);
    trigger.removeEventListener('blur', onBlur);
    media.removeEventListener('change', onMedia);
  };
}
