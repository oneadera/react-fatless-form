import type { ChangeEvent } from 'react'
import {
  FieldBinding,
  Focusable,
  FormValues,
  NumberFieldPath,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for a plain HTML `<input type="number">`. Returned by
 * {@link useNumberField} / {@link adaptNumberField}.
 *
 * `value` is always a `string` (the display text), even though the underlying form
 * value is a `number` - this keeps every field hook in this package consistently
 * `string`-valued for display, rather than some returning `number` and some `string`.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields whose
 * value is actually a `number`.
 */
export interface WebNumberFieldProps<
  TValues extends FormValues,
  TField extends NumberFieldPath<TValues>,
> {
  name: TField
  value: string
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<input type="number" onChange={onChange} />`. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onFocus: () => void
  /** Wire directly to `<input ref={ref} />` to make this field a valid target for `form.setFocus(...)`. */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link WebNumberFieldProps}.
 *
 * Parsing behavior, spelled out because controlled numeric inputs are deceptively
 * easy to get subtly wrong:
 * - Empty or whitespace-only input commits `null` (cleared). Whitespace is checked
 *   explicitly because `Number(' ')` is `0` in JavaScript, not `NaN` - without this,
 *   a stray space would silently commit zero instead of clearing the field.
 * - A fully-parseable, finite number (`Number.isFinite(event.target.valueAsNumber)`)
 *   commits immediately. `Number.isFinite` (not just "not NaN") also rules out
 *   `Infinity`/`-Infinity`.
 * - A non-empty but not-yet-parseable string (e.g. a lone `'-'` while typing a
 *   negative number, or `'1.'` while typing a decimal) is **ignored** - we don't
 *   commit anything, but we also don't fight the browser. Since nothing re-renders
 *   from this keystroke, the native input keeps whatever the user actually typed;
 *   only once it parses does the committed value (and therefore `value` above)
 *   catch up. This is intentionally simple. If you need real input masking or
 *   currency formatting, build a dedicated component with its own local string
 *   buffer instead of this hook - reconciling a controlled numeric value against
 *   free-form typing is a genuinely different problem than what this hook solves.
 */
export function adaptNumberField<
  TValues extends FormValues,
  TField extends NumberFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): WebNumberFieldProps<TValues, TField> {
  return {
    name: field.name,
    value: field.value === undefined ? '' : String(field.value),
    error: field.error,
    touched: field.touched,
    onChange: (event) => {
      if (event.target.value.trim() === '') {
        field.setValue(null)
        return
      }
      if (Number.isFinite(event.target.valueAsNumber)) {
        field.setValue(event.target.valueAsNumber)
      }
      // else: mid-typing an as-yet-invalid number - ignore until it parses.
    },
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    ref: field.ref,
  }
}

/**
 * Binds a single number-valued field to a plain HTML numeric input. See
 * {@link adaptNumberField} for exactly how partial/invalid typing is handled.
 *
 * @example
 * ```tsx
 * function AgeInput() {
 *   const { value, onChange } = useNumberField<ProfileValues>('age')
 *   return <input type="number" value={value} onChange={onChange} />
 * }
 * ```
 */
export function useNumberField<
  TValues extends FormValues = FormValues,
  TField extends NumberFieldPath<TValues> = NumberFieldPath<TValues>,
>(name: TField): WebNumberFieldProps<TValues, TField> {
  return adaptNumberField(useField<TValues, TField>(name))
}
