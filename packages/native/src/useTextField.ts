import {
  FieldBinding,
  Focusable,
  FormValues,
  StringFieldPath,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for React Native's `<TextInput>`. Returned by {@link useTextField} /
 * {@link adaptTextField}.
 *
 * `value` is always a plain `string` (never `undefined`) - if the underlying field is
 * currently unset, you get `''`.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields whose
 * value is actually a `string`.
 */
export interface NativeTextFieldProps<
  TValues extends FormValues,
  TField extends StringFieldPath<TValues>,
> {
  name: TField
  value: string
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<TextInput onChangeText={onChangeText} />`. */
  onChangeText: (text: string) => void
  /** Wire directly to `<TextInput onBlur={onBlur} />`. Marks the field touched on first blur. */
  onBlur: () => void
  /** Wire directly to `<TextInput onFocus={onFocus} />`. Currently a no-op (see core's `FieldBinding.onFocus`). */
  onFocus: () => void
  /** Wire directly to `<TextInput ref={ref} />` to make this field a valid target for `form.setFocus(...)`. */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link NativeTextFieldProps}.
 *
 * Deliberately almost a pass-through: RN's `TextInput.onChangeText` already hands
 * back a plain `string`, not a synthetic event - there's nothing to unwrap, unlike
 * web's `event.target.value`. This adapter exists mainly for the `value ?? ''`
 * default and for symmetry with the other field hooks in this package, not because
 * there's real DOM-style event translation happening. That asymmetry - web needs to
 * unwrap an event, native doesn't - is exactly the kind of platform difference this
 * package exists to absorb so it never ends up duplicated across every input
 * component you write.
 */
export function adaptTextField<
  TValues extends FormValues,
  TField extends StringFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): NativeTextFieldProps<TValues, TField> {
  return {
    name: field.name,
    value: field.value ?? '',
    error: field.error,
    touched: field.touched,
    onChangeText: field.setValue,
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    ref: field.ref,
  }
}

/**
 * Binds a single string-valued field to RN's `<TextInput>`.
 *
 * @example
 * ```tsx
 * function EmailInput() {
 *   const { value, onChangeText, onBlur, touched, error } = useTextField<SignupValues>('email')
 *   return (
 *     <View>
 *       <TextInput value={value} onChangeText={onChangeText} onBlur={onBlur} />
 *       {touched && error ? <Text>{error}</Text> : null}
 *     </View>
 *   )
 * }
 * ```
 *
 * @example Nested paths work the same way
 * ```tsx
 * useTextField<SignupValues>('address.street')
 * ```
 *
 * @example Jumping focus to the next field when the keyboard's return key is pressed
 * ```tsx
 * function FirstNameInput() {
 *   const form = useFormContext<SignupValues>()
 *   const { value, onChangeText, ref } = useTextField<SignupValues>('firstName')
 *   return (
 *     <TextInput
 *       ref={ref}
 *       value={value}
 *       onChangeText={onChangeText}
 *       returnKeyType="next"
 *       submitBehavior="submit"
 *       onSubmitEditing={() => form.setFocus('lastName')}
 *     />
 *   )
 * }
 * ```
 */
export function useTextField<
  TValues extends FormValues = FormValues,
  TField extends StringFieldPath<TValues> = StringFieldPath<TValues>,
>(name: TField): NativeTextFieldProps<TValues, TField> {
  return adaptTextField(useField<TValues, TField>(name))
}
