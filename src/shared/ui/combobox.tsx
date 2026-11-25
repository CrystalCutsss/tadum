import * as React from "react"
import { RiArrowDownSLine } from "@remixicon/react"
import { cn } from "cn"
import { Direction } from "radix-ui"

import { Icon } from "./icon/icon"
import { Input } from "./input"
import { Popover, PopoverAnchor, PopoverContent } from "./popover"

// Tadum (2026-11-25): поле с подсказками — паттерн WAI-ARIA «combobox» (редактируемый, list autocomplete,
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). Фокус всегда в поле, активный пункт — aria-activedescendant.
// Список — в Popover из shared/ui (портал получает dir от Direction.Provider), ширина — по полю (anchor).
// Свободный текст разрешён: выбор пункта только подставляет его label в value. Строк в компоненте нет.

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps
  extends Pick<
    React.ComponentProps<"input">,
    | "id"
    | "aria-invalid"
    | "aria-describedby"
    | "aria-label"
    | "aria-labelledby"
    | "aria-required"
    | "onBlur"
    | "disabled"
    | "readOnly"
    | "autoComplete"
    | "name"
    | "placeholder"
    | "ref"
    | "dir"
    | "className"
  > {
  value: string
  onValueChange: (value: string) => void
  options: readonly ComboboxOption[]
}

/** Фильтр подсказок: вхождение без учёта регистра; пустой запрос — все пункты. */
function filterOptions(options: readonly ComboboxOption[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((o) => o.label.toLowerCase().includes(q))
}

function Combobox({
  value,
  onValueChange,
  options,
  className,
  disabled,
  readOnly,
  onBlur,
  ref,
  ...inputProps
}: ComboboxProps) {
  const listboxId = React.useId()
  // Popover Radix сам dir не ставит: берём направление из Direction.Provider, чтобы портал не терял RTL.
  const dir = Direction.useDirection()
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [wantOpen, setWantOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  // Имя списка (axe aria-input-field-name): aria-labelledby/aria-label поля, иначе текст его <label>.
  const [labelText, setLabelText] = React.useState<string>()

  const filtered = React.useMemo(() => filterOptions(options, value), [options, value])
  const open = wantOpen && filtered.length > 0 && !disabled && !readOnly
  const optionId = (index: number) => `${listboxId}-option-${index}`
  const activeIndex = open && active < filtered.length ? active : -1

  // Активный пункт держим в видимой области прокручиваемого списка.
  React.useEffect(() => {
    if (activeIndex < 0) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const openList = (input: HTMLInputElement) => {
    setLabelText(input.labels?.[0]?.textContent ?? undefined)
    setWantOpen(true)
  }

  const close = () => {
    setWantOpen(false)
    setActive(-1)
  }

  const select = (option: ComboboxOption) => {
    onValueChange(option.label)
    close()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return
    const count = filtered.length
    switch (event.key) {
      case "ArrowDown": {
        if (!count) return
        event.preventDefault()
        if (!open) {
          openList(event.currentTarget)
          setActive(event.altKey ? -1 : 0)
        } else {
          setActive((i) => (i + 1) % count)
        }
        return
      }
      case "ArrowUp": {
        if (!count) return
        event.preventDefault()
        if (!open) {
          openList(event.currentTarget)
          setActive(count - 1)
        } else {
          setActive((i) => (i <= 0 ? count - 1 : i - 1))
        }
        return
      }
      case "Enter": {
        if (open && activeIndex >= 0) {
          event.preventDefault()
          select(filtered[activeIndex]!)
        }
        return
      }
      case "Escape": {
        if (open) {
          // Не закрываем заодно диалог или шторку, внутри которых стоит поле.
          event.preventDefault()
          event.stopPropagation()
          close()
        }
        return
      }
      case "Tab":
        close()
        return
    }
  }

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setWantOpen(true) : close())}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} data-slot="combobox" className="relative w-full">
          <Input
            {...inputProps}
            ref={ref}
            type="text"
            size="lg"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            data-slot="combobox-input"
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            className={cn("rounded-lg pe-11", className)}
            onChange={(event) => {
              onValueChange(event.target.value)
              openList(event.currentTarget)
              setActive(-1)
            }}
            onClick={(event) => {
              if (disabled || readOnly) return
              if (wantOpen) close()
              else openList(event.currentTarget)
            }}
            onKeyDown={onKeyDown}
            onBlur={(event) => {
              close()
              onBlur?.(event)
            }}
          />
          <Icon
            icon={RiArrowDownSLine}
            data-slot="combobox-chevron"
            className={cn(
              "pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform",
              open && "rotate-180",
              disabled && "opacity-50"
            )}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        ref={listRef}
        id={listboxId}
        role="listbox"
        dir={dir}
        aria-labelledby={inputProps["aria-labelledby"]}
        aria-label={inputProps["aria-labelledby"] ? undefined : (inputProps["aria-label"] ?? labelText)}
        data-slot="combobox-list"
        align="start"
        // Фокус остаётся в поле: список не забирает его ни при открытии, ни при закрытии.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // Клик по самому полю не считается «снаружи» — его обрабатывает onClick поля.
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault()
        }}
        className="max-h-72 w-(--radix-popover-trigger-width) gap-0 overflow-y-auto overscroll-contain p-1"
      >
        {filtered.map((option, index) => (
          <div
            key={option.value}
            id={optionId(index)}
            role="option"
            aria-selected={index === activeIndex}
            data-index={index}
            data-active={index === activeIndex ? "" : undefined}
            data-slot="combobox-option"
            className="flex min-h-11 cursor-pointer items-center rounded-xl px-3 py-2 text-start text-base select-none hover:bg-accent hover:text-accent-foreground data-active:bg-accent data-active:text-accent-foreground"
            // mousedown не уводит фокус из поля (иначе blur закроет список до click).
            onMouseDown={(event) => event.preventDefault()}
            onMouseMove={() => {
              if (active !== index) setActive(index)
            }}
            onClick={() => select(option)}
          >
            {option.label}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
