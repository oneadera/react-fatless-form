import { createFormContext } from './createFormContext'
import { FormValues } from './types'

const defaultFormContext = createFormContext<FormValues>()

/**
 * The package's default, shared form context provider. Wrap your form
 * tree in this and pass it the object returned by {@link useForm}; any
 * descendant can then read it with {@link useFormContext} or bind
 * individual fields with {@link useField} - no prop drilling required.
 *
 * For most apps, this one shared context is all you need. Reach for
 * {@link createFormContext} only if you need multiple, fully independent
 * form contexts at once.
 *
 * @example
 * ```tsx
 * function SignupPage() {
 *   const form = useForm<SignupValues>({ email: '', password: '' })
 *   return (
 *     <FormProvider form={form}>
 *       <EmailField />
 *     </FormProvider>
 *   )
 * }
 * ```
 */
export const FormProvider = defaultFormContext.FormProvider

/**
 * Reads the form most recently provided by an ancestor {@link FormProvider}.
 * Pass your form's value type as an explicit type argument to get a fully
 * typed result back - the type argument is what makes real typing possible
 * here, since the underlying context value is type-erased to support every
 * form shape sharing one context.
 *
 * Throws if called outside a {@link FormProvider}.
 *
 * @typeParam TValues - Your form's value type, e.g. `useFormContext<SignupValues>()`.
 *
 * @example
 * ```tsx
 * function SubmitButton() {
 *   const form = useFormContext<SignupValues>()
 *   return <button disabled={form.submissionStatus === 'submitting'}>Submit</button>
 * }
 * ```
 */
export const useFormContext = defaultFormContext.useFormContext

/** Alias for {@link useFormContext}. */
export const useFormProvider = defaultFormContext.useFormProvider
