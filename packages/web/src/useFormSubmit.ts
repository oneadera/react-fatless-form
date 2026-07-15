import { useCallback } from 'react'
import type { SyntheticEvent } from 'react'
import {
  FormValues,
  HandleSubmitConfig,
  ValidationResolver,
  handleSubmit,
  useFormContext,
} from 'react-fatless-form'

/**
 * Wraps core's {@link handleSubmit} for a plain HTML `<form>`: calls
 * `event.preventDefault()` so the browser doesn't navigate/reload, then runs the
 * same validate → submit → update-status flow every platform shares.
 *
 * This is the only place DOM-specific submission behavior lives - `preventDefault`
 * is meaningless on native, which is exactly why it's here and not in core.
 *
 * Reads the form from context internally (like {@link useTextField}/etc. do), so you
 * only need to supply the validation resolver and your submit logic - **but that
 * also means this must be called by a component rendered as a descendant of
 * `FormProvider`, not the component that creates the `FormProvider` element
 * itself.** A component can never be a descendant of a provider it renders in its
 * own return value, no matter how the JSX is arranged - context only flows to
 * *other* components nested inside it. The usual fix is to split the piece that
 * owns `useForm`/`FormProvider` from the piece with the `<form>` and submit button,
 * as below. If your structure genuinely can't be split that way (e.g. the trigger
 * needs values/callbacks from way outside the `FormProvider` subtree), call
 * {@link handleSubmit} directly instead - it takes `form` as an explicit argument,
 * so it works from anywhere.
 *
 * `TValues` is inferred from `resolver` in almost every case - you typically don't
 * need to write it out:
 *
 * @example
 * ```tsx
 * // SignupForm owns the form and creates FormProvider - it is NOT a descendant
 * // of the provider it renders, so useFormSubmit can't be called here.
 * function SignupForm() {
 *   const form = useForm<SignupValues>(initialValues)
 *   return (
 *     <FormProvider form={form}>
 *       <SignupFormFields />
 *     </FormProvider>
 *   )
 * }
 *
 * // SignupFormFields IS a descendant of FormProvider, so useFormSubmit (and any
 * // other context-reading hook, like useTextField) works here.
 * function SignupFormFields() {
 *   const onSubmit = useFormSubmit(
 *     yupResolver(signupSchema), // resolver's type already pins TValues to SignupValues
 *     async (values) => api.signup(values),
 *     { onSuccess: () => navigate('/welcome') },
 *   )
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <TextInput name="email" />
 *       <button type="submit">Sign up</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @param resolver - Same resolver you'd pass to core's `handleSubmit` directly, e.g.
 * `yupResolver(schema)`.
 * @param onSubmit - Called with the current values once validation passes.
 * @param config - Optional `onSuccess`/`onError`/`resetOnSuccess`, same as core's
 * `HandleSubmitConfig`. Pass a stable reference (e.g. via `useMemo` or module scope)
 * if you want the returned handler's identity to stay stable across renders.
 * @returns An event handler ready for `<form onSubmit={...}>`.
 */
export function useFormSubmit<TValues extends FormValues, TResult = void>(
  resolver: ValidationResolver<TValues>,
  onSubmit: (values: TValues) => Promise<TResult>,
  config?: HandleSubmitConfig<TResult>,
): (event: SyntheticEvent<HTMLFormElement>) => void {
  const form = useFormContext<TValues>()

  return useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      void handleSubmit(form, resolver, onSubmit, config)
    },
    [form, resolver, onSubmit, config],
  )
}
