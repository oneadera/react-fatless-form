import type { ChangeEvent } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { adaptMultiSelectField, useMultiSelectField } from '../src/useMultiSelectField'
import { createFieldBinding, createFormWrapper, renderWithForm } from './test-utils'

interface SignupValues {
  countries: string[]
}

/** A fake ChangeEvent whose target.selectedOptions is a plain array of { value }. */
function multiSelectChangeEvent(values: string[]) {
  return {
    target: { selectedOptions: values.map((value) => ({ value })) },
  } as unknown as ChangeEvent<HTMLSelectElement>
}

describe('adaptMultiSelectField - value display', () => {
  it('falls back to an empty array when the field value is undefined', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ value: undefined })
    expect(adaptMultiSelectField(field).value).toEqual([])
  })

  it('passes a real array value through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ value: ['ke', 'ng'] })
    expect(adaptMultiSelectField(field).value).toEqual(['ke', 'ng'])
  })

  it('preserves an already-empty array', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ value: [] })
    expect(adaptMultiSelectField(field).value).toEqual([])
  })
})

describe('adaptMultiSelectField - onChange', () => {
  it('collects every selected option, not just the last one', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ touched: true })
    adaptMultiSelectField(field).onChange(multiSelectChangeEvent(['ke', 'et', 'ng']))
    expect(field.setValue).toHaveBeenCalledWith(['ke', 'et', 'ng'])
  })

  it('commits an empty array when every option is deselected', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({
      value: ['ke'],
      touched: true,
    })
    adaptMultiSelectField(field).onChange(multiSelectChangeEvent([]))
    expect(field.setValue).toHaveBeenCalledWith([])
  })

  it('marks the field touched immediately on change when not already touched', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ touched: undefined })
    adaptMultiSelectField(field).onChange(multiSelectChangeEvent(['ke']))
    expect(field.setTouched).toHaveBeenCalledWith(true)
  })

  it('does not call setTouched again once already touched', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ touched: true })
    adaptMultiSelectField(field).onChange(multiSelectChangeEvent(['ke']))
    expect(field.setTouched).not.toHaveBeenCalled()
  })
})

describe('adaptMultiSelectField - passthrough', () => {
  it('echoes the field name', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({ name: 'countries' })
    expect(adaptMultiSelectField(field).name).toBe('countries')
  })

  it('passes error and touched through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'countries'>({
      error: 'Pick at least one',
      touched: true,
    })
    const props = adaptMultiSelectField(field)
    expect(props.error).toBe('Pick at least one')
    expect(props.touched).toBe(true)
  })

  it('passes onBlur, onFocus, and ref through as the same function references', () => {
    const field = createFieldBinding<SignupValues, 'countries'>()
    const props = adaptMultiSelectField(field)
    expect(props.onBlur).toBe(field.onBlur)
    expect(props.onFocus).toBe(field.onFocus)
    expect(props.ref).toBe(field.ref)
  })
})

describe('useMultiSelectField', () => {
  it('reflects the initial form value', () => {
    const { result } = renderWithForm(() => useMultiSelectField<SignupValues>('countries'), {
      countries: ['ke'],
    })
    expect(result.current.value).toEqual(['ke'])
  })
})

function CountriesSelect() {
  const { value, onChange } = useMultiSelectField<SignupValues>('countries')
  return (
    <select aria-label="countries" multiple value={[...value]} onChange={onChange}>
      <option value="ke">Kenya</option>
      <option value="et">Ethiopia</option>
      <option value="ng">Nigeria</option>
    </select>
  )
}

describe('useMultiSelectField - end-to-end DOM round trip', () => {
  it('selecting multiple options commits all of their values, not just the last one', () => {
    const { Wrapper, form } = createFormWrapper<SignupValues>({ countries: [] })
    render(<CountriesSelect />, { wrapper: Wrapper })

    const select = screen.getByLabelText('countries') as HTMLSelectElement
    const kenya = screen.getByRole('option', { name: 'Kenya' }) as HTMLOptionElement
    const nigeria = screen.getByRole('option', { name: 'Nigeria' }) as HTMLOptionElement

    kenya.selected = true
    nigeria.selected = true
    fireEvent.change(select)

    expect(form.current.values.countries).toEqual(['ke', 'ng'])
  })
})
