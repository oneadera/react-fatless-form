import type { ChangeEvent } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { adaptTextField, useTextField } from '../src/useTextField'
import { createFieldBinding, createFormWrapper, renderWithForm } from './test-utils'

interface SignupValues {
  email: string
  address: { street: string }
}

function textChangeEvent(value: string) {
  return { target: { value } } as unknown as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
}

describe('adaptTextField', () => {
  it('falls back to an empty string when the field value is undefined', () => {
    const field = createFieldBinding<SignupValues, 'email'>({ value: undefined })
    expect(adaptTextField(field).value).toBe('')
  })

  it('passes a real string value through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'email'>({ value: 'a@b.com' })
    expect(adaptTextField(field).value).toBe('a@b.com')
  })

  it('preserves an empty string as an empty string (not confused with undefined)', () => {
    const field = createFieldBinding<SignupValues, 'email'>({ value: '' })
    expect(adaptTextField(field).value).toBe('')
  })

  it('onChange calls setValue with event.target.value', () => {
    const field = createFieldBinding<SignupValues, 'email'>()
    adaptTextField(field).onChange(textChangeEvent('a@b.com'))
    expect(field.setValue).toHaveBeenCalledWith('a@b.com')
  })

  it('onChange forwards an empty string too (e.g. deleting all input)', () => {
    const field = createFieldBinding<SignupValues, 'email'>()
    adaptTextField(field).onChange(textChangeEvent(''))
    expect(field.setValue).toHaveBeenCalledWith('')
  })

  it('echoes the field name', () => {
    const field = createFieldBinding<SignupValues, 'email'>({ name: 'email' })
    expect(adaptTextField(field).name).toBe('email')
  })

  it('passes error and touched through unchanged', () => {
    const field = createFieldBinding<SignupValues, 'email'>({ error: 'Invalid', touched: true })
    const props = adaptTextField(field)
    expect(props.error).toBe('Invalid')
    expect(props.touched).toBe(true)
  })

  it('passes onBlur, onFocus, and ref through as the same function references', () => {
    const field = createFieldBinding<SignupValues, 'email'>()
    const props = adaptTextField(field)
    expect(props.onBlur).toBe(field.onBlur)
    expect(props.onFocus).toBe(field.onFocus)
    expect(props.ref).toBe(field.ref)
  })
})

describe('useTextField', () => {
  it('reflects the initial form value', () => {
    const { result } = renderWithForm(
      () => useTextField<SignupValues>('email'),
      { email: 'a@b.com', address: { street: '' } },
    )
    expect(result.current.value).toBe('a@b.com')
  })

  it('reads and writes a nested field path', () => {
    const { result } = renderWithForm(
      () => useTextField<SignupValues>('address.street'),
      { email: '', address: { street: '123 Main St' } },
    )
    expect(result.current.value).toBe('123 Main St')
  })
})

function EmailInput() {
  const { value, onChange, onBlur } = useTextField<SignupValues>('email')
  return <input aria-label="email" value={value} onChange={onChange} onBlur={onBlur} />
}

describe('useTextField - end-to-end DOM round trip', () => {
  const initialValues: SignupValues = { email: '', address: { street: '' } }

  it('typing into the input updates the underlying form value', () => {
    const { Wrapper, form } = createFormWrapper(initialValues)
    render(<EmailInput />, { wrapper: Wrapper })

    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'a@b.com' } })

    expect(form.current.values.email).toBe('a@b.com')
  })

  it('blurring the input marks the field touched', () => {
    const { Wrapper, form } = createFormWrapper(initialValues)
    render(<EmailInput />, { wrapper: Wrapper })

    expect(form.current.touched.email).toBeUndefined()
    fireEvent.blur(screen.getByLabelText('email'))

    expect(form.current.touched.email).toBe(true)
  })
})
