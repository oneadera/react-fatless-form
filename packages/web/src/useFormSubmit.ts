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
 * only need to supply the validation resolver and your submit logic.
 *
 * `TValues` is inferred from `resolver` in almost every case - you typically don't
 * need to write it out:
 *
 * @example
 * ```tsx
 * function SignupForm() {
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
