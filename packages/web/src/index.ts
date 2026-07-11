/**
 * `react-fatless-form-web`
 *
 * Web bindings for `react-fatless-form`. Everything platform-agnostic
 * (`useForm`, `FormProvider`, `useFormContext`, `handleSubmit`, `yupResolver`, the
 * `FieldPath`/`FieldValue` type machinery, etc.) is re-exported here unchanged, so
 * this package is the only thing a web app needs to import from.
 *
 * What's actually defined in *this* package is the DOM-specific layer on top:
 * {@link useTextField}, {@link useCheckboxField}, {@link useNumberField},
 * {@link useSelectField}, {@link useFileField}, and {@link useFormSubmit}.
 * Each does exactly one job - unwrap a DOM event into the plain value core's
 * `useField` expects - so the DOM event handling never has to leak into your
 * own input components.
 *
 * Radio buttons: use {@link useTextField} directly. Both `<input type="radio">`
 * and `<input type="text">` surface their committed value through
 * `event.target.value`; the adapters are identical, so there's no separate
 * `useRadioField`.
 */
export * from 'react-fatless-form'

export { adaptTextField, useTextField } from './useTextField'
export type { WebTextFieldProps } from './useTextField'

export { adaptCheckboxField, useCheckboxField } from './useCheckboxField'
export type { WebCheckboxFieldProps } from './useCheckboxField'

export { adaptNumberField, useNumberField } from './useNumberField'
export type { WebNumberFieldProps } from './useNumberField'

export { adaptSelectField, useSelectField } from './useSelectField'
export type { WebSelectFieldProps } from './useSelectField'

export { adaptMultiSelectField, useMultiSelectField } from './useMultiSelectField'
export type { WebMultiSelectFieldProps } from './useMultiSelectField'

export { adaptCheckboxGroupItem, useCheckboxGroupItem } from './useCheckboxGroupItem'
export type { WebCheckboxGroupItemProps } from './useCheckboxGroupItem'

export { adaptFileField, useFileField } from './useFileField'
export type { WebFileFieldProps, FileFieldPath } from './useFileField'

export { useFormSubmit } from './useFormSubmit'
