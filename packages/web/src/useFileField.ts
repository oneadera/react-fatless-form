import type { ChangeEvent } from 'react'
import {
  FieldBinding,
  FieldPath,
  FieldValue,
  FormValues,
  useField,
} from 'react-fatless-form'

/**
 * Constrains `TField` to paths whose value type is `File[]`, `File[] | null`,
 * or `File[] | undefined`. Lives in this package (not core) because `File` is
 * a DOM type with no React Native equivalent.
 *
 * @example
 * ```ts
 * interface UploadValues {
 *   resume: File[]         // FileFieldPath - included
 *   email: string          // StringFieldPath - excluded
 * }
 * type FilePaths = FileFieldPath<UploadValues> // 'resume'
 * ```
 */
export type FileFieldPath<TValues extends FormValues> = {
  [Key in FieldPath<TValues>]: FieldValue<TValues, Key> extends
    | File[]
    | null
    | undefined
    ? Key
    : never
}[FieldPath<TValues>]

/**
 * Props shaped for `<input type="file">`. Returned by {@link useFileField} /
 * {@link adaptFileField}.
 *
 * `value` is always `File[]` - never `null` or `undefined`, and never the
 * raw `FileList` object from the DOM (which can't be constructed in tests and
 * doesn't support array methods). An empty input gives `[]`.
 *
 * There's no `ref` here: file inputs are almost always hidden (visually styled
 * via a separate label or button), making programmatic focus via
 * `form.setFocus(...)` unusual enough that omitting it keeps the interface
 * clean. Use `useField` directly if you need the raw `ref`.
 *
 * @typeParam TValues - Your form's values shape.
 * @typeParam TField - The specific dot-path, constrained to `File[]`-typed fields.
 */
export interface WebFileFieldProps<
  TValues extends FormValues,
  TField extends FileFieldPath<TValues>,
> {
  name: TField
  value: File[]
  error: string | undefined
  touched: boolean | undefined
  /** Wire directly to `<input type="file" onChange={onChange} />`. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
}

/**
 * Pure adapter from a raw {@link FieldBinding} to {@link WebFileFieldProps}.
 */
export function adaptFileField<
  TValues extends FormValues,
  TField extends FileFieldPath<TValues>,
>(field: FieldBinding<TValues, TField>): WebFileFieldProps<TValues, TField> {
  const rawValue = field.value

  return {
    name: field.name,
    // `rawValue` is typed as `FieldValue<TValues, TField> | undefined`, where
    // `FieldValue<TValues, TField>` is a conditional type that TypeScript cannot
    // reduce in a generic context - even though `TField extends FileFieldPath<TValues>`
    // logically proves the resolved type is `File[] | null | undefined`, TypeScript's
    // narrowing doesn't flow through conditional type aliases. `Array.isArray` can
    // narrow concrete types but not unreduced conditional ones. The cast to `File[]`
    // is sound because `FileFieldPath<TValues>` ensures `TField`'s value type IS
    // `File[] | null | undefined` by construction.
    value: Array.isArray(rawValue) ? (rawValue as File[]) : [],
    error: field.error,
    touched: field.touched,
    onChange: (event) => {
      const fileList = event.target.files
      // Same conditional-type limitation as above: `File[]` is assignable to
      // `FieldValue<TValues, TField>` when `TField extends FileFieldPath<TValues>`,
      // but TypeScript can't prove it without the cast. The alternative (`as any`)
      // would be strictly worse - this at least pins the target type precisely.
      field.setValue((fileList ? Array.from(fileList) : []) as FieldValue<
        TValues,
        TField
      >)
      if (!field.touched) {
        field.setTouched(true)
      }
    },
    onBlur: field.onBlur,
  }
}

/**
 * Binds a `File[]`-typed field to `<input type="file">`.
 *
 * Define the field's value type as `File[]` in your form's interface:
 *
 * ```ts
 * interface UploadValues {
 *   resume: File[]
 * }
 * const form = useForm<UploadValues>({ resume: [] })
 * ```
 *
 * Then wire the hook:
 *
 * @example
 * ```tsx
 * function ResumeUpload() {
 *   const { value, onChange, touched, error } = useFileField<UploadValues>('resume')
 *   return (
 *     <div>
 *       <input type="file" accept=".pdf,.docx" multiple onChange={onChange} />
 *       {value.length > 0 && <span>{value.length} file(s) selected</span>}
 *       {touched && error && <span>{error}</span>}
 *     </div>
 *   )
 * }
 * ```
 *
 * Note: `<input type="file">` is inherently uncontrolled for security reasons
 * (browsers don't allow setting `value` programmatically to a file path). Wire
 * `onChange` but not `value`. To clear the selection imperatively (e.g. after
 * a successful upload), use a React `key` reset rather than trying to set the
 * input's value.
 */
export function useFileField<
  TValues extends FormValues = FormValues,
  TField extends FileFieldPath<TValues> = FileFieldPath<TValues>,
>(name: TField): WebFileFieldProps<TValues, TField> {
  return adaptFileField(useField<TValues, TField>(name))
}
