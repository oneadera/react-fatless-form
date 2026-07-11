import type { ChangeEvent } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { adaptNumberField, useNumberField } from '../src/useNumberField'
import { createFieldBinding, createFormWrapper } from './test-utils'

interface ProfileValues {
  age: number | null
}

/**
 * Builds a minimal fake `ChangeEvent<HTMLInputElement>` with an explicit
 * `value`/`valueAsNumber` pair. Used instead of a real `<input type="number">`
 * for most cases here because `valueAsNumber` is a jsdom-computed DOM
 * property following the HTML spec's own "parse a floating-point number"
 * algorithm - constructing the pair explicitly tests `adaptNumberField`'s
 * own branching logic precisely, independent of jsdom's fidelity to that
 * algorithm. A real end-to-end DOM round-trip is covered separately below.
 */
function numberChangeEvent(value: string, valueAsNumber: number) {
  return { target: { value, valueAsNumber } } as unknown as ChangeEvent<HTMLInputElement>
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

  it('displays zero as "0", not as empty (falsy-but-valid)', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ value: 0 })
    expect(adaptNumberField(field).value).toBe('0')
  })

  it('displays a negative decimal correctly', () => {
    const field = createFieldBinding<ProfileValues, 'age'>({ value: -3.5 })
    expect(adaptNumberField(field).value).toBe('-3.5')
  })

  it('displays the literal string "null" when the field value is null - worth a second look', () => {
    // `value: field.value === undefined ? '' : String(field.value)` only
    // special-cases `undefined`. Since this hook's own onChange commits
    // `null` for a cleared input (see the "commits null" test below),
    // clearing the field and re-rendering would display the text "null" in
    // the input rather than leaving it blank. This test asserts the actual
    // current behavior so it's easy to notice if that's ever revisited.
    const field = createFieldBinding<ProfileValues, 'age'>({ value: null })
    expect(adaptNumberField(field).value).toBe('null')
  })
})

describe('adaptNumberField - onChange', () => {
  it('commits null for an empty string', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('', NaN))
    expect(field.setValue).toHaveBeenCalledWith(null)
  })

  it('commits null for a whitespace-only string, not zero', () => {
    // Number(' ') is 0 in JS - the explicit trim/empty check exists
    // precisely to avoid silently committing zero here.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('   ', 0))
    expect(field.setValue).toHaveBeenCalledWith(null)
  })

  it('commits a valid positive integer immediately', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('42', 42))
    expect(field.setValue).toHaveBeenCalledWith(42)
  })

  it('commits a valid negative decimal immediately', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('-3.5', -3.5))
    expect(field.setValue).toHaveBeenCalledWith(-3.5)
  })

  it('commits zero when the input is exactly "0"', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('0', 0))
    expect(field.setValue).toHaveBeenCalledWith(0)
  })

  it('ignores a value the browser reports as unparseable (valueAsNumber is NaN)', () => {
    // e.g. mid-typing "-5": raw text is "-", not yet parseable.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('-', NaN))
    expect(field.setValue).not.toHaveBeenCalled()
  })

  it('ignores Infinity even though it is not NaN (Number.isFinite, not just !isNaN)', () => {
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('Infinity', Infinity))
    expect(field.setValue).not.toHaveBeenCalled()
  })

  it('commits "1." as 1, contrary to this hook\'s own doc comment example', () => {
    // The doc comment above `adaptNumberField` lists '1.' alongside a lone
    // '-' as "not-yet-parseable" input that gets ignored. Per the HTML
    // living standard's "rules for parsing floating-point number values"
    // (what `valueAsNumber` is built on), a trailing '.' with no following
    // digit is simply excluded from the fraction and parsing still succeeds
    // at 1 - the same way `Number('1.') === 1` on the native side (see the
    // native package's equivalent test). This documents the actual runtime
    // behavior, which appears to diverge from the doc comment's example.
    const field = createFieldBinding<ProfileValues, 'age'>()
    adaptNumberField(field).onChange(numberChangeEvent('1.', 1))
    expect(field.setValue).toHaveBeenCalledWith(1)
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

function AgeInput() {
  const { value, onChange } = useNumberField<ProfileValues>('age')
  return <input aria-label="age" type="number" value={value} onChange={onChange} />
}

describe('useNumberField - end-to-end DOM round trip', () => {
  it('displays the initial form value', () => {
    const { Wrapper } = createFormWrapper<ProfileValues>({ age: 25 })
    render(<AgeInput />, { wrapper: Wrapper })

    expect(screen.getByLabelText('age')).toHaveValue(25)
  })

  it('typing an unambiguous valid number updates the underlying form value', () => {
    const { Wrapper, form } = createFormWrapper<ProfileValues>({ age: null })
    render(<AgeInput />, { wrapper: Wrapper })

    fireEvent.change(screen.getByLabelText('age'), { target: { value: '42' } })

    expect(form.current.values.age).toBe(42)
  })
})
