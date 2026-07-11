import type { ChangeEvent } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { adaptCheckboxField, useCheckboxField } from '../src/useCheckboxField'
import { createFieldBinding, createFormWrapper, renderWithForm } from './test-utils'

interface SignupValues {
  remember: boolean
}

function checkboxChangeEvent(checked: boolean) {
  return { target: { checked } } as unknown as ChangeEvent<HTMLInputElement>
}

describe('adaptCheckboxField - checked display', () => {
  it('falls back to false when the field value is undefined', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: undefined })
    expect(adaptCheckboxField(field).checked).toBe(false)
  })

  it('reflects true', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: true })
    expect(adaptCheckboxField(field).checked).toBe(true)
  })

  it('reflects false explicitly (not confused with the undefined fallback)', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: false })
    expect(adaptCheckboxField(field).checked).toBe(false)
  })
})

describe('adaptCheckboxField - onChange', () => {
  it('calls setValue with the checkbox checked state', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: true })
    adaptCheckboxField(field).onChange(checkboxChangeEvent(true))
    expect(field.setValue).toHaveBeenCalledWith(true)
  })

  it('calls setValue(false) when unchecking', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: true, touched: true })
    adaptCheckboxField(field).onChange(checkboxChangeEvent(false))
    expect(field.setValue).toHaveBeenCalledWith(false)
  })

  it('marks the field touched immediately on change when not already touched', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: undefined })
    adaptCheckboxField(field).onChange(checkboxChangeEvent(true))
    expect(field.setTouched).toHaveBeenCalledWith(true)
  })

  it('does not call setTouched again once the field is already touched', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: true })
    adaptCheckboxField(field).onChange(checkboxChangeEvent(true))
    expect(field.setTouched).not.toHaveBeenCalled()
  })

  it('still calls setValue even when already touched', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: true })
    adaptCheckboxField(field).onChange(checkboxChangeEvent(false))
    expect(field.setValue).toHaveBeenCalledWith(false)
  })
})

describe('adaptCheckboxField - passthrough', () => {
  it('echoes the field name', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ name: 'remember' })
    expect(adaptCheckboxField(field).name).toBe('remember')
  })

  it('passes error through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ error: 'Required' })
    expect(adaptCheckboxField(field).error).toBe('Required')
  })

  it('passes onBlur, onFocus, and ref through as the same function references', () => {
    const field = createFieldBinding<SignupValues, 'remember'>()
    const props = adaptCheckboxField(field)
    expect(props.onBlur).toBe(field.onBlur)
    expect(props.onFocus).toBe(field.onFocus)
    expect(props.ref).toBe(field.ref)
  })
})

describe('useCheckboxField', () => {
  it('reflects the initial form value', () => {
    const { result } = renderWithForm(() => useCheckboxField<SignupValues>('remember'), {
      remember: true,
    })
    expect(result.current.checked).toBe(true)
  })
})

function RememberCheckbox() {
  const { checked, onChange } = useCheckboxField<SignupValues>('remember')
  return <input aria-label="remember" type="checkbox" checked={checked} onChange={onChange} />
}

describe('useCheckboxField - end-to-end DOM round trip', () => {
  it('clicking the checkbox updates the underlying form value', () => {
    const { Wrapper, form } = createFormWrapper<SignupValues>({ remember: false })
    render(<RememberCheckbox />, { wrapper: Wrapper })

    fireEvent.click(screen.getByLabelText('remember'))

    expect(form.current.values.remember).toBe(true)
  })

  it('clicking the checkbox marks it touched immediately, with no separate blur needed', () => {
    const { Wrapper, form } = createFormWrapper<SignupValues>({ remember: false })
    render(<RememberCheckbox />, { wrapper: Wrapper })

    expect(form.current.touched.remember).toBeUndefined()
    fireEvent.click(screen.getByLabelText('remember'))

    expect(form.current.touched.remember).toBe(true)
  })
})
