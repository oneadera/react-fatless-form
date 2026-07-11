import type { ChangeEvent } from 'react'
import {
  FieldBinding,
  Focusable,
  FormValues,
  StringFieldPath,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for a plain HTML `<select>`. Returned by {@link useSelectField}
 * / {@link adaptSelectField}.
 *
 * `value` is always a `string` - never `undefined`. A `<select>` with no
 * option selected gives `''`, consistent with how {@link useTextField} treats
 * an empty text input.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields
 * whose value is actually a `string`.
 */
export interface WebSelectFieldProps<
  TValues extends FormValues,
  TField extends StringFieldPath<TValues>,
> {
  name: TField
  value: string
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<select onChange={onChange} />`. */
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  /** Wire directly to `<select onBlur={onBlur} />`. Marks the field touched on first blur. */
  onBlur: () => void
  onFocus: () => void
  /** Wire to `<select ref={ref} />` to support `form.setFocus(...)`. */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link WebSelectFieldProps}.
 *
 * @example
 * ```ts
 * // Custom form context, still gets the select adapter:
 * const useCheckoutField = createUseField(useCheckoutFormContext)
 * function useCheckoutSelectField<TField extends StringFieldPath<CheckoutValues>>(name: TField) {
 *   return adaptSelectField(useCheckoutField(name))
 * }
 * ```
 */
export function adaptSelectField<
  TValues extends FormValues,
  TField extends StringFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): WebSelectFieldProps<TValues, TField> {
  return {
    name: field.name,
    value: field.value ?? '',
    error: field.error,
    touched: field.touched,
    onChange: (event) => {
      field.setValue(event.target.value)
      if (!field.touched) {
        field.setTouched(true)
      }
    },
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    ref: field.ref,
  }
}

/**
 * Binds a string-valued field to a plain HTML `<select>`. Marks the field
 * touched immediately on change (not waiting for blur), since selecting an
 * option is a complete, discrete interaction - there's no "in-progress"
 * typing state like a text input has.
 *
 * For radio buttons, use {@link useTextField} directly - both `<input
 * type="radio">` and `<input type="text">` surface their value through
 * `event.target.value` and `event.target.checked` is not involved, so
 * the adapters are identical. There's no separate `useRadioField`.
 *
 * @example
 * ```tsx
 * function CountrySelect() {
 *   const { value, onChange, onBlur, touched, error } = useSelectField<SignupValues>('country')
 *   return (
 *     <div>
 *       <select value={value} onChange={onChange} onBlur={onBlur}>
 *         <option value="">Select a country</option>
 *         <option value="ke">Kenya</option>
 *         <option value="ng">Nigeria</option>
 *       </select>
 *       {touched && error && <span>{error}</span>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSelectField<
  TValues extends FormValues = FormValues,
  TField extends StringFieldPath<TValues> = StringFieldPath<TValues>,
>(name: TField): WebSelectFieldProps<TValues, TField> {
  return adaptSelectField(useField<TValues, TField>(name))
}
