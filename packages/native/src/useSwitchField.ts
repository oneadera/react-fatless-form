import {
  BooleanFieldPath,
  FieldBinding,
  Focusable,
  FormValues,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for React Native's `<Switch>`. Returned by {@link useSwitchField} /
 * {@link adaptSwitchField}.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields whose
 * value is actually a `boolean`.
 */
export interface NativeSwitchFieldProps<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues>,
> {
  name: TField
  value: boolean
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<Switch onValueChange={onValueChange} />`. */
  onValueChange: (value: boolean) => void
  /**
   * Wire to `<Switch ref={ref} />` if you want this field reachable via
   * `form.setFocus(...)`. Whether that's actually useful depends on your installed
   * RN version's `Switch` ref exposing a `.focus()` method - if it doesn't, TypeScript
   * will tell you so directly at the `ref={ref}` call site, which is the correct
   * place to find that out (this package can't assert RN's exact ref API for every
   * version, so it doesn't try to).
   */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link NativeSwitchFieldProps}.
 *
 * Marks the field touched immediately on change, same reasoning as the web
 * checkbox adapter: a switch is a single discrete toggle with no meaningful "blur"
 * on touch devices, so there's no reason to wait for one before showing validation
 * feedback. There's no `onBlur`/`onFocus` here at all (unlike the text field
 * adapters) - `<Switch>` doesn't have a text-cursor-style focus model, so exposing
 * those props would just be dead weight on every call site.
 */
export function adaptSwitchField<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): NativeSwitchFieldProps<TValues, TField> {
  return {
    name: field.name,
    value: field.value ?? false,
    error: field.error,
    touched: field.touched,
    onValueChange: (value) => {
      field.setValue(value)
      if (!field.touched) {
        field.setTouched(true)
      }
    },
    ref: field.ref,
  }
}

/**
 * Binds a single boolean-valued field to RN's `<Switch>`.
 *
 * @example
 * ```tsx
 * function RememberMeSwitch() {
 *   const { value, onValueChange } = useSwitchField<SignupValues>('remember')
 *   return <Switch value={value} onValueChange={onValueChange} />
 * }
 * ```
 */
export function useSwitchField<
  TValues extends FormValues = FormValues,
  TField extends BooleanFieldPath<TValues> = BooleanFieldPath<TValues>,
>(name: TField): NativeSwitchFieldProps<TValues, TField> {
  return adaptSwitchField(useField<TValues, TField>(name))
}
