import {
  FieldBinding,
  Focusable,
  FormValues,
  NumberFieldPath,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for React Native's `<TextInput keyboardType="numeric">` (or
 * `"number-pad"` / `"decimal-pad"`). Returned by {@link useNumberField} /
 * {@link adaptNumberField}.
 *
 * `value` is always a `string` (the display text), even though the underlying form
 * value is a `number` - RN's `TextInput` only ever speaks `string` through
 * `onChangeText`, numeric keyboard or not, so this hook does the parsing for you.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields whose
 * value is actually a `number`.
 */
export interface NativeNumberFieldProps<
  TValues extends FormValues,
  TField extends NumberFieldPath<TValues>,
> {
  name: TField
  value: string
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<TextInput keyboardType="numeric" onChangeText={onChangeText} />`. */
  onChangeText: (text: string) => void
  onBlur: () => void
  onFocus: () => void
  /** Wire directly to `<TextInput ref={ref} />` to make this field a valid target for `form.setFocus(...)`. */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link NativeNumberFieldProps}.
 *
 * Parsing behavior (mirrors the web number adapter, adjusted for there being no
 * DOM event to read `valueAsNumber` off of):
 * - Empty or whitespace-only input commits `null` (cleared). Whitespace is checked
 *   explicitly because `Number(' ')` is `0` in JavaScript, not `NaN` - without this,
 *   a stray space (more plausible here than on web, since `onChangeText` hands back
 *   whatever raw string was typed, pasted, or autofilled, with no browser-level
 *   sanitization in between) would silently commit zero instead of clearing the field.
 * - A fully-parseable, finite number (`Number.isFinite(Number(text))`) commits
 *   immediately. `Number.isFinite` (not just "not NaN") also rules out
 *   `Infinity`/`-Infinity`.
 * - A non-empty but not-yet-parseable string (e.g. a lone `'-'`, or `'1.'` mid-typing
 *   a decimal) is **ignored** - nothing is committed, and nothing re-renders from
 *   this keystroke. Note that unlike the web case, RN's controlled `TextInput` has
 *   its own well-documented platform quirks around re-syncing `value` (most visibly
 *   on Android), so verify this feels right on-device for your target platforms
 *   before relying on it for anything finicky. For real input masking or currency
 *   formatting, build a dedicated component with its own local string buffer instead.
 */
export function adaptNumberField<
  TValues extends FormValues,
  TField extends NumberFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): NativeNumberFieldProps<TValues, TField> {
  return {
    name: field.name,
    value: field.value === undefined ? '' : String(field.value),
    error: field.error,
    touched: field.touched,
    onChangeText: (text) => {
      if (text.trim() === '') {
        field.setValue(null)
        return
      }
      const parsed = Number(text)
      if (Number.isFinite(parsed)) {
        field.setValue(parsed)
      }
      // else: mid-typing an as-yet-invalid number - ignore until it parses.
    },
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    ref: field.ref,
  }
}

/**
 * Binds a single number-valued field to RN's `<TextInput>` with a numeric keyboard.
 * See {@link adaptNumberField} for exactly how partial/invalid typing is handled.
 *
 * @example
 * ```tsx
 * function AgeInput() {
 *   const { value, onChangeText } = useNumberField<ProfileValues>('age')
 *   return <TextInput keyboardType="numeric" value={value} onChangeText={onChangeText} />
 * }
 * ```
 */
export function useNumberField<
  TValues extends FormValues = FormValues,
  TField extends NumberFieldPath<TValues> = NumberFieldPath<TValues>,
>(name: TField): NativeNumberFieldProps<TValues, TField> {
  return adaptNumberField(useField<TValues, TField>(name))
}
