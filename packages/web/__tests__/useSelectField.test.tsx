import type { ChangeEvent } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { adaptSelectField, useSelectField } from '../src/useSelectField'
import { createFieldBinding, createFormWrapper, renderWithForm } from './test-utils'

interface SignupValues {
  country: string
}

function selectChangeEvent(value: string) {
  return { target: { value } } as unknown as ChangeEvent<HTMLSelectElement>
}

describe('adaptSelectField - value display', () => {
  it('falls back to an empty string when the field value is undefined', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ value: undefined })
    expect(adaptSelectField(field).value).toBe('')
  })

  it('passes a real string value through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ value: 'ke' })
    expect(adaptSelectField(field).value).toBe('ke')
  })
})

describe('adaptSelectField - onChange', () => {
  it('calls setValue with the selected option value', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ touched: true })
    adaptSelectField(field).onChange(selectChangeEvent('ke'))
    expect(field.setValue).toHaveBeenCalledWith('ke')
  })

  it('marks the field touched immediately on change when not already touched', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ touched: undefined })
    adaptSelectField(field).onChange(selectChangeEvent('ke'))
    expect(field.setTouched).toHaveBeenCalledWith(true)
  })

  it('does not call setTouched again once already touched', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ touched: true })
    adaptSelectField(field).onChange(selectChangeEvent('ke'))
    expect(field.setTouched).not.toHaveBeenCalled()
  })

  it('still calls setValue even when already touched', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ touched: true })
    adaptSelectField(field).onChange(selectChangeEvent('ng'))
    expect(field.setValue).toHaveBeenCalledWith('ng')
  })
})

describe('adaptSelectField - passthrough', () => {
  it('echoes the field name', () => {
    const field = createFieldBinding<SignupValues, 'country'>({ name: 'country' })
    expect(adaptSelectField(field).name).toBe('country')
  })

  it('passes error and touched through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'country'>({
      error: 'Required',
      touched: true,
    })
    const props = adaptSelectField(field)
    expect(props.error).toBe('Required')
    expect(props.touched).toBe(true)
  })

  it('passes onBlur, onFocus, and ref through as the same function references', () => {
    const field = createFieldBinding<SignupValues, 'country'>()
    const props = adaptSelectField(field)
    expect(props.onBlur).toBe(field.onBlur)
    expect(props.onFocus).toBe(field.onFocus)
    expect(props.ref).toBe(field.ref)
  })
})

describe('useSelectField', () => {
  it('reflects the initial form value', () => {
    const { result } = renderWithForm(() => useSelectField<SignupValues>('country'), {
      country: 'ke',
    })
    expect(result.current.value).toBe('ke')
  })
})

function CountrySelect() {
  const { value, onChange } = useSelectField<SignupValues>('country')
  return (
    <select aria-label="country" value={value} onChange={onChange}>
      <option value="">Select a country</option>
      <option value="ke">Kenya</option>
      <option value="ng">Nigeria</option>
    </select>
  )
}

describe('useSelectField - end-to-end DOM round trip', () => {
  it('choosing an option updates the underlying form value', () => {
    const { Wrapper, form } = createFormWrapper<SignupValues>({ country: '' })
    render(<CountrySelect />, { wrapper: Wrapper })

    fireEvent.change(screen.getByLabelText('country'), { target: { value: 'ng' } })

    expect(form.current.values.country).toBe('ng')
  })

  it('choosing an option marks the field touched immediately, with no separate blur needed', () => {
    const { Wrapper, form } = createFormWrapper<SignupValues>({ country: '' })
    render(<CountrySelect />, { wrapper: Wrapper })

    expect(form.current.touched.country).toBeUndefined()
    fireEvent.change(screen.getByLabelText('country'), { target: { value: 'ke' } })

    expect(form.current.touched.country).toBe(true)
  })
})
