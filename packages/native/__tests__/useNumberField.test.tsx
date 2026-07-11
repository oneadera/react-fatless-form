import { act } from '@testing-library/react'

import { adaptNumberField, useNumberField } from '../src/useNumberField'
import { createFieldBinding, renderWithForm } from './test-utils'

interface ProfileValues {
  age: number | null
}

describe('adaptNumberField - value display', () => {
  it('displays an empty string when the field value is undefined', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ value: undefined })
    expect(adaptNumberField(field).value).toBe('')
  })

  it('displays a plain number as its string form', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ value: 42 })
    expect(adaptNumberField(field).value).toBe('42')
  })

  it('displays zero as "0", not as empty', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ value: 0 })
    expect(adaptNumberField(field).value).toBe('0')
  })

  it('displays the literal string "null" when the field value is null - matches the web adapter\'s same quirk', () => {
    // Same root cause as the web package's equivalent test: only `undefined`
    // is special-cased, so `String(null)` ("null") is what actually renders
    // after the field is cleared. See useNumberField.test.tsx in the web
    // package for the fuller explanation.
    const field = createFieldBinding<ProfileValues, 'age'>({ value: null })
    expect(adaptNumberField(field).value).toBe('null')
  })
})

describe('adaptNumberField - onChangeText', () => {
  it('commits null for an empty string', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('')
    expect(field.setValue).toHaveBeenCalledWith(null)
  })

  it('commits null for a whitespace-only string, not zero', () => {
    // Number(' ') is 0 in JS - the explicit trim/empty check exists
    // precisely to avoid silently committing zero here. Whitespace is
    // arguably more likely here than on web, since onChangeText hands back
    // whatever was typed/pasted/autofilled with no sanitization in between.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('   ')
    expect(field.setValue).toHaveBeenCalledWith(null)
  })

  it('commits a valid positive integer immediately', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('42')
    expect(field.setValue).toHaveBeenCalledWith(42)
  })

  it('commits a valid negative decimal immediately', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('-3.5')
    expect(field.setValue).toHaveBeenCalledWith(-3.5)
  })

  it('commits zero when the input is exactly "0"', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('0')
    expect(field.setValue).toHaveBeenCalledWith(0)
  })

  it('ignores a lone "-" (mid-typing a negative number)', () => {
    // Verified directly: Number('-') is NaN.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('-')
    expect(field.setValue).not.toHaveBeenCalled()
  })

  it('ignores non-numeric garbage', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('abc')
    expect(field.setValue).not.toHaveBeenCalled()
  })

  it('ignores "Infinity" even though Number("Infinity") is not NaN (Number.isFinite, not just !isNaN)', () => {
    // Verified directly: Number('Infinity') === Infinity, and
    // Number.isFinite(Infinity) === false.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('Infinity')
    expect(field.setValue).not.toHaveBeenCalled()
  })

  it('commits "1." as 1, contrary to this hook\'s own doc comment example', () => {
    // Verified directly: Number('1.') === 1, and Number.isFinite(1) === true.
    // The doc comment above `adaptNumberField` lists '1.' alongside a lone
    // '-' as "ignored" input, but JS's own Number() coercion parses a
    // trailing, digit-less decimal point successfully. This documents the
    // actual runtime behavior; see also the web package's equivalent test,
    // which finds the same outcome via valueAsNumber/the HTML spec's parsing
    // algorithm.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('1.')
    expect(field.setValue).toHaveBeenCalledWith(1)
  })

  it('commits "007" as 7 (Number() strips leading zeros, this hook does not special-case it)', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChangeText('007')
    expect(field.setValue).toHaveBeenCalledWith(7)
  })
})

describe('adaptNumberField - passthrough', () => {
  it('echoes the field name', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ name: 'age' })
    expect(adaptNumberField(field).name).toBe('age')
  })

  it('passes error and touched through unchanged', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ error: 'Too young', touched: true })
    const props = adaptNumberField(field)
    expect(props.error).toBe('Too young')
    expect(props.touched).toBe(true)
  })

  it('passes onBlur, onFocus, and ref through as the same function references', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    const props = adaptNumberField(field)
    expect(props.onBlur).toBe(field.onBlur)
    expect(props.onFocus).toBe(field.onFocus)
    expect(props.ref).toBe(field.ref)
  })
})

describe('useNumberField', () => {
  it('reflects the initial form value', () => {
    const { result } = renderWithForm(() => useNumberField<ProfileValues>('age'), { age: 25 })
    expect(result.current.value).toBe('25')
  })

  it('updates the underlying form value through onChangeText', () => {
    const { result, form } = renderWithForm(() => useNumberField<ProfileValues>('age'), {
      age: null,
    })

    act(() => {
      result.current.onChangeText('42')
    })

    expect(form.current.values.age).toBe(42)
  })

  it('leaves the form value unchanged while typing an as-yet-invalid number', () => {
    const { result, form } = renderWithForm(() => useNumberField<ProfileValues>('age'), {
      age: null,
    })

    act(() => {
      result.current.onChangeText('-')
    })

    expect(form.current.values.age).toBeNull()
  })
})
