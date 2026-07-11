import { FieldPath, FieldValue, FormValues, PlatformFieldValue } from './types'

/**
 * Normalizes bracket-notation array indices to dot-notation, e.g.
 * `users[0].name` → `users.0.name`. FieldPath (and everything keyed by it -
 * FormErrors, FormTouched, useField) always uses dot-notation, but some
 * sources - notably yup's ValidationError#path for array items - report
 * bracket notation. Anything that accepts a path from outside this package
 * should normalize it through here first.
 */
export function normalizePath(path: string): string {
  return path.replace(/\[(\d+)\]/g, '.$1')
}

/** Retrieves a deeply nested value from an object using a dot-notated string path. */
export function get<TValues extends FormValues, TField extends FieldPath<TValues>>(
  obj: TValues,
  path: TField,
): FieldValue<TValues, TField> | undefined
export function get(obj: any, path: string, defaultValue?: any): any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the runtime walk
// below genuinely can't be typed step-by-step (we don't statically know the shape
// at each segment of an arbitrary path); the overloads above are what give callers
// real type safety, this implementation signature is intentionally permissive.
export function get(obj: any, path: string, defaultValue?: any): any {
  if (!path) return undefined

  const keys = normalizePath(path).split('.')

  let result = obj
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) return defaultValue
  }
  return result
}

/**
 * Immutably sets a deeply nested value in an object using a dot-notated string path.
 * This ensures React detects state changes correctly.
 */
export function set<TValues extends FormValues, TField extends FieldPath<TValues>>(
  obj: TValues,
  path: TField,
  value: FieldValue<TValues, TField> | PlatformFieldValue,
): TValues
export function set(obj: any, path: string, value: any): any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same rationale as `get`
export function set(obj: any, path: string, value: any): any {
  if (!path) return obj

  const keys = normalizePath(path).split('.')
  const root = Array.isArray(obj) ? [...obj] : { ...obj }
  let current: any = root

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key === undefined) {
      // Unreachable given the loop bounds (i < keys.length), but
      // noUncheckedIndexedAccess can't see that invariant - this is the
      // honest way to satisfy it without a non-null assertion.
      break
    }

    const isLast = i === keys.length - 1

    if (isLast) {
      current[key] = value
    } else {
      const nextKey = keys[i + 1]
      if (nextKey === undefined) {
        // Unreachable: isLast is false here, so i + 1 < keys.length.
        break
      }

      const isNumericKey = /^\d+$/.test(nextKey)

      // Shallow clone the next level down
      if (Array.isArray(current[key])) {
        current[key] = [...current[key]]
      } else if (typeof current[key] === 'object' && current[key] !== null) {
        current[key] = { ...current[key] }
      } else {
        // Create array or object if it doesn't exist
        current[key] = isNumericKey ? [] : {}
      }
      current = current[key]
    }
  }

  return root
}
