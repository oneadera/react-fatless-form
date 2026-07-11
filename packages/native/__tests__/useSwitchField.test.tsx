import { act } from '@testing-library/react'

import { adaptSwitchField, useSwitchField } from '../src/useSwitchField'
import { createFieldBinding, renderWithForm } from './test-utils'

interface SignupValues {
  remember: boolean
}

describe('adaptSwitchField - value display', () => {
  it('falls back to false when the field value is undefined', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: undefined })
    expect(adaptSwitchField(field).value).toBe(false)
  })

  it('reflects true', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: true })
    expect(adaptSwitchField(field).value).toBe(true)
  })

  it('reflects false explicitly', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: false })
    expect(adaptSwitchField(field).value).toBe(false)
  })
})

describe('adaptSwitchField - onValueChange', () => {
  it('calls setValue with the new boolean value', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: true })
    adaptSwitchField(field).onValueChange(true)
    expect(field.setValue).toHaveBeenCalledWith(true)
  })

  it('calls setValue(false) when toggling off', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ value: true, touched: true })
    adaptSwitchField(field).onValueChange(false)
    expect(field.setValue).toHaveBeenCalledWith(false)
  })

  it('marks the field touched immediately when not already touched', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: undefined })
    adaptSwitchField(field).onValueChange(true)
    expect(field.setTouched).toHaveBeenCalledWith(true)
  })

  it('does not call setTouched again once already touched', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ touched: true })
    adaptSwitchField(field).onValueChange(true)
    expect(field.setTouched).not.toHaveBeenCalled()
  })
})

describe('adaptSwitchField - passthrough and shape', () => {
  it('echoes the field name', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ name: 'remember' })
    expect(adaptSwitchField(field).name).toBe('remember')
  })

  it('passes error through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'remember'>({ error: 'Required' })
    expect(adaptSwitchField(field).error).toBe('Required')
  })

  it('passes ref through as the same function reference', () => {
    const field = createFieldBinding<SignupValues, 'remember'>()
    expect(adaptSwitchField(field).ref).toBe(field.ref)
  })

  it('does not expose onBlur or onFocus - Switch has no text-cursor focus model', () => {
    const field = createFieldBinding<SignupValues, 'remember'>()
    const props = adaptSwitchField(field)
    expect(props).not.toHaveProperty('onBlur')
    expect(props).not.toHaveProperty('onFocus')
  })
})

describe('useSwitchField', () => {
  it('reflects the initial form value', () => {
    const { result } = renderWithForm(() => useSwitchField<SignupValues>('remember'), {
      remember: true,
    })
    expect(result.current.value).toBe(true)
  })

  it('updates the underlying form value and marks it touched when toggled', () => {
    const { result, form } = renderWithForm(() => useSwitchField<SignupValues>('remember'), {
      remember: false,
    })

    act(() => {
      result.current.onValueChange(true)
    })

    expect(form.current.values.remember).toBe(true)
    expect(form.current.touched.remember).toBe(true)
  })
})
