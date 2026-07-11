import type { ChangeEvent } from 'react'
import {
  BooleanFieldPath,
  FieldBinding,
  Focusable,
  FormValues,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for a plain HTML `<input type="checkbox">`. Returned by
 * {@link useCheckboxField} / {@link adaptCheckboxField}.
 *
 * Deliberately named `checked`, not `value` - matching the DOM's own checkbox
 * attribute, so wiring it is a direct `<input type="checkbox" checked={checked} ... />`
 * with no renaming on your end.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields whose
 * value is actually a `boolean` (e.g. `'remember'`, `'preferences.newsletter'`).
 */
export interface WebCheckboxFieldProps<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues>,
> {
  name: TField
  checked: boolean
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<input type="checkbox" onChange={onChange} />`. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onFocus: () => void
  /**
   * Wire directly to `<input ref={ref} />` to make this field a valid target for
   * `form.setFocus(...)` - useful for, e.g., focusing a required checkbox the user
   * left unchecked after a failed submit.
   */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link WebCheckboxFieldProps}.
 * No hook calls - safe to call conditionally or reuse against a custom form context.
 *
 * Marks the field touched immediately on change, not just on blur: a checkbox is a
 * single discrete click, so by the time `onChange` fires the user has already fully
 * "interacted" with it - waiting for a blur event (which may never come on some
 * input methods) to start showing validation feedback would just delay it for no
 * benefit.
 */
export function adaptCheckboxField<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): WebCheckboxFieldProps<TValues, TField> {
  return {
    name: field.name,
    checked: field.value ?? false,
    error: field.error,
    touched: field.touched,
    onChange: (event) => {
      field.setValue(event.target.checked)
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
 * Binds a single boolean-valued field to a plain HTML checkbox.
 *
 * @example
 * ```tsx
 * function RememberMeCheckbox() {
 *   const { checked, onChange } = useCheckboxField<SignupValues>('remember')
 *   return <input type="checkbox" checked={checked} onChange={onChange} />
 * }
 * ```
 */
export function useCheckboxField<
  TValues extends FormValues = FormValues,
  TField extends BooleanFieldPath<TValues> = BooleanFieldPath<TValues>,
>(name: TField): WebCheckboxFieldProps<TValues, TField> {
  return adaptCheckboxField(useField<TValues, TField>(name))
}
