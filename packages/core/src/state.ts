import { FormErrors, FormState, FormTouched, FormValues } from './types'

/**
 * Builds a fresh {@link FormState} from a set of initial values: the given
 * values, with empty errors and empty touched state. This is what
 * `useForm` calls internally to seed and reset its state - reach for it
 * directly only if you're building your own form-state hook (e.g. via
 * {@link createUseField}'s lower-level pattern) instead of using `useForm`.
 */
export function createFormState<TValues extends FormValues>(
  values: TValues,
): FormState<TValues> {
  return {
    values,
    errors: createEmptyErrors<TValues>(),
    touched: createEmptyTouched<TValues>(),
  }
}

/** An empty {@link FormErrors} object, typed to `TValues`. */
export function createEmptyErrors<
  TValues extends FormValues,
>(): FormErrors<TValues> {
  return {}
}

/** An empty {@link FormTouched} object, typed to `TValues`. */
export function createEmptyTouched<
  TValues extends FormValues,
>(): FormTouched<TValues> {
  return {}
}
