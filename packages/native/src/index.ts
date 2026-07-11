/**
 * `react-fatless-form-native`
 *
 * React Native bindings for `react-fatless-form`. Everything platform-agnostic
 * (`useForm`, `FormProvider`, `useFormContext`, `handleSubmit`, `yupResolver`, the
 * `FieldPath`/`FieldValue` type machinery, etc.) is re-exported here unchanged, so
 * this package is the only thing a native app needs to import from.
 *
 * What's actually defined in *this* package is the RN-specific layer on top:
 * {@link useTextField}, {@link useSwitchField}, {@link useNumberField}, and
 * {@link useFormSubmit}. None of it knows anything about the DOM - no
 * `ChangeEvent`, no `event.target`, no `preventDefault`. That's deliberate: the
 * `react-fatless-form-web` package handles the DOM-specific half of this same job,
 * and the two are never imported into each other.
 */
export * from 'react-fatless-form'

export { adaptTextField, useTextField } from './useTextField'
export type { NativeTextFieldProps } from './useTextField'

export { adaptSwitchField, useSwitchField } from './useSwitchField'
export type { NativeSwitchFieldProps } from './useSwitchField'

export { adaptNumberField, useNumberField } from './useNumberField'
export type { NativeNumberFieldProps } from './useNumberField'

export { useFormSubmit } from './useFormSubmit'
