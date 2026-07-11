import type { ChangeEvent } from 'react'
import {
  FieldBinding,
  Focusable,
  FormValues,
  StringFieldPath,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for a plain HTML text-like input - `<input type="text|email|password|...">`
 * or `<textarea>`. Returned by {@link useTextField} (and by {@link adaptTextField}, if
 * you're wiring a custom form context via `core`'s `createUseField` instead of the
 * default one).
 *
 * `value` is always a plain `string` (never `undefined`) - if the underlying field is
 * currently unset, you get `''`, so you never need a `value ?? ''` fallback in your
 * own component.
 *
 * @typeParam TValues - Your form's values shape, e.g. `interface SignupValues { email: string }`.
 * @typeParam TField - The specific dot-path being bound, constrained to fields whose
 * value is actually a `string` (e.g. `'email'`, `'address.street'` - but not `'remember'`
 * if that's a `boolean`). This is what lets `value` below be a real `string` with no cast.
 */
export interface WebTextFieldProps<
  TValues extends FormValues,
  TField extends StringFieldPath<TValues>,
> {
  name: TField
  value: string
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<input onChange={onChange} />` or `<textarea onChange={onChange} />`. */
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  /** Wire directly to `<input onBlur={onBlur} />`. Marks the field touched on first blur. */
  onBlur: () => void
  /** Wire directly to `<input onFocus={onFocus} />`. Currently a no-op (see core's `FieldBinding.onFocus`). */
  onFocus: () => void
  /**
   * Wire directly to `<input ref={ref} />` (or `<textarea ref={ref} />`) to make this field
   * a valid target for `form.setFocus('email')`. Optional - only wire it up for fields you
   * actually want to be able to jump focus to.
   */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} (core's platform-agnostic shape) to
 * {@link WebTextFieldProps} (DOM-event-shaped). Has no hook calls of its own, so you
 * can call it conditionally, in a loop, or outside a component - useful if you're
 * building your own hook on top of a custom form context:
 *
 * @example
 * ```ts
 * // Custom form context (see core's createUseField), still gets the DOM adapter:
 * const useCheckoutField = createUseField(useCheckoutFormContext)
 * function useCheckoutTextField<TField extends StringFieldPath<CheckoutValues>>(name: TField) {
 *   return adaptTextField(useCheckoutField(name))
 * }
 * ```
 */
export function adaptTextField<
  TValues extends FormValues,
  TField extends StringFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): WebTextFieldProps<TValues, TField> {
  return {
    name: field.name,
    value: field.value ?? '',
    error: field.error,
    touched: field.touched,
    onChange: (event) => field.setValue(event.target.value),
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    ref: field.ref,
  }
}

/**
 * Binds a single string-valued field to a plain HTML text-like input. This is the
 * web equivalent of building your own `TextInput` wrapper by hand around core's
 * `useField` - it just does the DOM event unwrapping for you.
 *
 * @typeParam TValues - Your form's values shape. Always pass this explicitly:
 * `useTextField<SignupValues>('email')`.
 * @typeParam TField - Defaults to every string-valued path on `TValues`, and is narrowed
 * automatically from whatever literal you pass as `name` - you don't need to specify it.
 *
 * @example
 * ```tsx
 * function EmailInput() {
 *   const { value, onChange, onBlur, touched, error } = useTextField<SignupValues>('email')
 *   return (
 *     <div>
 *       <input value={value} onChange={onChange} onBlur={onBlur} />
 *       {touched && error && <span>{error}</span>}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example Nested paths work the same way
 * ```tsx
 * useTextField<SignupValues>('address.street')
 * ```
 *
 * @example Jumping focus to another field
 * ```tsx
 * function FirstNameInput() {
 *   const form = useFormContext<SignupValues>()
 *   const { value, onChange, ref } = useTextField<SignupValues>('firstName')
 *   return (
 *     <input
 *       ref={ref}
 *       value={value}
 *       onChange={onChange}
 *       onKeyDown={(e) => {
 *         if (e.key === 'Enter') form.setFocus('lastName')
 *       }}
 *     />
 *   )
 * }
 * ```
 */
export function useTextField<
  TValues extends FormValues = FormValues,
  TField extends StringFieldPath<TValues> = StringFieldPath<TValues>,
>(name: TField): WebTextFieldProps<TValues, TField> {
  return adaptTextField(useField<TValues, TField>(name))
}
