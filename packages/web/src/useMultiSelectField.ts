import type { ChangeEvent } from 'react'
import {
  FieldBinding,
  Focusable,
  FormValues,
  StringArrayFieldPath,
  useField,
} from 'react-fatless-form'

/**
 * Props shaped for `<select multiple>`. Returned by {@link useMultiSelectField}
 * / {@link adaptMultiSelectField}.
 *
 * `value` is always `readonly string[]` - never `null` or `undefined`. An
 * empty selection gives `[]`.
 *
 * **Why not just `useSelectField` with `multiple`?** `<select multiple>`
 * needs `event.target.selectedOptions` to get all selected option values.
 * `event.target.value` - what `useSelectField`'s `onChange` reads - gives only
 * the value of the most recently interacted option, silently discarding all
 * others. Runtime-verified: selecting Kenya, Ethiopia, Nigeria gives
 * `event.target.value === 'nigeria'` (the last one), not all three.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path being bound, constrained to fields
 * whose value is `string[]` or `readonly string[]`.
 */
export interface WebMultiSelectFieldProps<
  TValues extends FormValues,
  TField extends StringArrayFieldPath<TValues>,
> {
  name: TField
  value: readonly string[]
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<select multiple onChange={onChange} />`. */
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  onBlur: () => void
  onFocus: () => void
  /** Wire to `<select ref={ref} />` to support `form.setFocus(...)`. */
  ref: (instance: Focusable | null) => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link WebMultiSelectFieldProps}.
 */
export function adaptMultiSelectField<
  TValues extends FormValues,
  TField extends StringArrayFieldPath<TValues>,
>(
  field: FieldBinding<TValues, TField>,
): WebMultiSelectFieldProps<TValues, TField> {
  // `field.value` is `FieldValue<TValues, TField> | undefined`, where the
  // conditional type resolves to `readonly string[] | null | undefined` given
  // `TField extends StringArrayFieldPath<TValues>`. TypeScript can't reduce
  // conditional types in generic bodies even with the constraint, hence the
  // cast. Same limitation documented in useFileField.ts.
  const currentValue = Array.isArray(field.value)
    ? (field.value as readonly string[])
    : []

  return {
    name: field.name,
    value: currentValue,
    error: field.error,
    touched: field.touched,
    onChange: (event) => {
      // selectedOptions captures ALL currently selected options, not just the
      // one most recently clicked. This is the only correct way to read a
      // multi-select's full state.
      //
      // The explicit <HTMLOptionElement> type argument is required for full
      // type safety: plain `Array.from(collection)` relies on TypeScript
      // inferring T from `HTMLCollectionOf<T extends Element>` through the
      // ArrayLike<T> overload - which works in some TS/lib combinations but
      // widens to `unknown[]` in others, causing `opt.value` to fail. This
      // is a generic type argument (same as `useState<string>()`), not a
      // cast - TypeScript uses it to type-check the call, not bypass it.
      const selected = Array.from<HTMLOptionElement>(event.target.selectedOptions).map(
        (opt) => opt.value,
      )
      // `selected` is `string[]`. `string[]` extends `readonly string[]` which
      // is in `PlatformFieldValue`, so this is assignable without a cast.
      field.setValue(selected)
      if (!field.touched) {
        field.setTouched(true)
      }
    },
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    ref: field.ref,
  }
}

/**
 * Binds a `string[]`-typed field to `<select multiple>`.
 *
 * Declare the field as `string[]` in your form interface:
 *
 * ```ts
 * interface SignupValues {
 *   countries: string[]   // ✓ - useMultiSelectField accepts this
 *   country: string       // ✗ - use useSelectField for a single string
 * }
 * ```
 *
 * @example
 * ```tsx
 * function CountriesSelect() {
 *   const { value, onChange, touched, error } = useMultiSelectField<SignupValues>('countries')
 *   return (
 *     <div>
 *       <select multiple value={[...value]} onChange={onChange}>
 *         <option value="ke">Kenya</option>
 *         <option value="ng">Nigeria</option>
 *         <option value="et">Ethiopia</option>
 *       </select>
 *       {touched && error && <span>{error}</span>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useMultiSelectField<
  TValues extends FormValues = FormValues,
  TField extends StringArrayFieldPath<TValues> = StringArrayFieldPath<TValues>,
>(name: TField): WebMultiSelectFieldProps<TValues, TField> {
  return adaptMultiSelectField(useField<TValues, TField>(name))
}
