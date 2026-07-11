import type * as yup from 'yup'

import { FormErrors, FormValues, ValidationResolver, FieldPath } from './types'
import { normalizePath } from './utils'

interface YupErrorItem {
  path?: string
  message: string
}

/** The shape of yup's ValidationError that this file actually relies on. */
interface YupValidationErrorLike {
  name: string
  inner: readonly YupValidationErrorLike[]
  path?: string
  message: string
}

/**
 * Structurally checks whether `error` looks like a yup `ValidationError`,
 * rather than `error instanceof yup.ValidationError`.
 *
 * This is deliberate, not a shortcut. `instanceof` would require this file
 * to import yup at runtime - and if a consumer's dependency tree ever ends
 * up with two separately-installed copies of yup (a real, classic
 * monorepo/version-mismatch hazard), an error thrown by *their* copy would
 * fail `instanceof` against *our* copy, silently rethrowing a perfectly
 * normal validation error instead of handling it. yup's `ValidationError`
 * always sets `name: 'ValidationError'` and always carries `inner`/`message` -
 * specific enough to identify reliably without caring which module instance
 * constructed it, and without this package needing yup as a runtime
 * dependency at all. The `import type` above is fully erased at compile
 * time, so `yup` is needed here only for the `ObjectSchema<TValues>` type
 * below, never at runtime - see this package's README for what that means
 * for your own dependency on yup.
 */
function isYupValidationError(error: unknown): error is YupValidationErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ValidationError' &&
    'inner' in error &&
    'message' in error
  )
}

function toYupErrorItem(error: YupValidationErrorLike): YupErrorItem {
  return {
    path: error.path ?? undefined,
    message: error.message,
  }
}

function collectYupErrors(error: YupValidationErrorLike): readonly YupErrorItem[] {
  if (error.inner.length > 0) {
    return error.inner.map(toYupErrorItem)
  }
  return [toYupErrorItem(error)]
}

/**
 * Builds a {@link ValidationResolver} from a yup object schema, for use
 * with `form.validate(...)` or {@link handleSubmit}. Validates synchronously
 * and converts yup's `ValidationError` into this package's
 * {@link FormErrors} shape - including normalizing yup's bracket-notation
 * array paths (`items[0].name`) into the dot-notation this package's
 * {@link FieldPath} uses everywhere (`items.0.name`).
 *
 * @param schema - The yup object schema to validate against.
 * @param abortEarly - Passed straight through to yup's `validateSync`. Defaults to `false`,
 * so all field errors are collected, not just the first one encountered.
 *
 * @example
 * ```ts
 * const schema = yup.object({
 *   email: yup.string().email().required(),
 *   password: yup.string().min(8).required(),
 * })
 *
 * const resolver = yupResolver(schema)
 * await handleSubmit(form, resolver, submit)
 * ```
 */
export function yupResolver<TValues extends FormValues>(
  schema: yup.ObjectSchema<TValues>,
  abortEarly = false,
): ValidationResolver<TValues> {
  return (values: TValues): FormErrors<TValues> => {
    try {
      schema.validateSync(values, { abortEarly })
      return {}
    } catch (error) {
      if (!isYupValidationError(error)) {
        throw error
      }

      return collectYupErrors(error).reduce<FormErrors<TValues>>(
        (accumulator, item) => {
          if (item.path === undefined) {
            return accumulator
          }

          // yup reports array item errors in bracket notation (e.g.
          // 'items[0].name'), but FieldPath - and therefore every
          // FormErrors/FormTouched key and every useField(name) call -
          // uses dot notation ('items.0.name'). Normalize before storing,
          // or array field errors silently never match up with their input.
          const field = normalizePath(item.path) as FieldPath<TValues>
          if (accumulator[field] !== undefined) {
            return accumulator
          }

          return {
            ...accumulator,
            [field]: item.message,
          }
        },
        {},
      )
    }
  }
}
