import * as React from "react"
import { cn } from "cn"

import { ClearButton } from "./clear-button"
import { Input } from "./input"

// Tadum (2026-11-25): поле с крестиком очистки (правка Кирилла по блоку «About your business»).
// Пропсы — как у Input, плюс clearLabel (aria-label крестика) и onClear. ref указывает на <input>.
// Крестик виден, когда в поле есть хотя бы один символ, и не виден в readOnly/disabled.
// dir поля ставится и на обёртку: крестик стоит на стороне end относительно направления самого поля
// (у dir="ltr" — справа и в RTL-интерфейсе).

type ClearableInputProps = React.ComponentProps<typeof Input> & {
  clearLabel: string
  onClear: () => void
}

function ClearableInput({
  clearLabel,
  onClear,
  className,
  ref,
  dir,
  value,
  defaultValue,
  onChange,
  disabled,
  readOnly,
  ...props
}: ClearableInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const controlled = value !== undefined
  // Для неконтролируемого поля наличие текста отслеживаем сами.
  const [uncontrolledFilled, setUncontrolledFilled] = React.useState(
    defaultValue !== undefined && String(defaultValue).length > 0
  )
  const filled = controlled ? String(value).length > 0 : uncontrolledFilled
  const showClear = filled && !disabled && !readOnly

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }

  const clear = () => {
    const input = inputRef.current
    if (!controlled && input) {
      input.value = ""
      setUncontrolledFilled(false)
    }
    onClear()
    input?.focus()
  }

  return (
    <div data-slot="clearable-input" dir={dir} className="relative w-full">
      <Input
        {...props}
        ref={setRefs}
        dir={dir}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => {
          if (!controlled) setUncontrolledFilled(event.target.value.length > 0)
          onChange?.(event)
        }}
        className={cn(showClear && "pe-11", className)}
      />
      {showClear && <ClearButton label={clearLabel} onClear={clear} className="end-2" />}
    </div>
  )
}

export { ClearableInput, type ClearableInputProps }
