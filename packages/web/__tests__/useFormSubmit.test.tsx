import type { SyntheticEvent } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ValidationResolver } from 'react-fatless-form'

import { useFormSubmit } from '../src/useFormSubmit'
import { createFormWrapper, renderWithForm } from './test-utils'

interface SignupValues {
  email: string
}

const alwaysValid: ValidationResolver<SignupValues> = () => ({})
const alwaysInvalid: ValidationResolver<SignupValues> = () => ({ email: 'Required' })

function fakeFormEvent() {
  return { preventDefault: jest.fn() } as unknown as SyntheticEvent<HTMLFormElement>
}

describe('useFormSubmit', () => {
  it('calls event.preventDefault()', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysValid, onSubmit),
      { email: 'a@b.com' },
    )
    const event = fakeFormEvent()

    act(() => {
      result.current(event)
    })

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('calls preventDefault even when validation will fail', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysInvalid, onSubmit),
      { email: '' },
    )
    const event = fakeFormEvent()

    act(() => {
      result.current(event)
    })

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('wires through to a real submit flow - onSubmit is eventually called with the form values', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result, form } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysValid, onSubmit),
      { email: 'a@b.com' },
    )

    act(() => {
      result.current(fakeFormEvent())
    })

    // handleSubmit runs fire-and-forget (`void handleSubmit(...)`), so its
    // post-await state updates (success status, the onSubmit call itself)
    // land a few microtask hops after result.current() returns. waitFor is
    // Testing Library's purpose-built tool for exactly this - polling an
    // assertion until it passes, while correctly keeping React's act()
    // tracking happy - rather than hand-timing a manual flush.
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' })
    })
    expect(form.current.submissionStatus).toBe('success')
  })

  it('does not call onSubmit when validation fails', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysInvalid, onSubmit),
      { email: '' },
    )

    // Unlike the success path above, validation failure never reaches an
    // `await` - handleSubmit returns synchronously right after marking
    // fields touched, so there's nothing to wait for here.
    act(() => {
      result.current(fakeFormEvent())
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})

function SignupForm({ onSubmit }: { onSubmit: (values: SignupValues) => Promise<void> }) {
  const submit = useFormSubmit<SignupValues>(alwaysValid, onSubmit)
  return (
    <form aria-label="signup" onSubmit={submit}>
      <button type="submit">Sign up</button>
    </form>
  )
}

describe('useFormSubmit - end-to-end DOM round trip', () => {
  it('prevents the browser default form submission', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { Wrapper } = createFormWrapper<SignupValues>({ email: 'a@b.com' })
    render(<SignupForm onSubmit={onSubmit} />, { wrapper: Wrapper })

    // fireEvent.X returns the result of the underlying dispatchEvent() call,
    // which is false when a cancelable event had preventDefault() called.
    const notPrevented = fireEvent.submit(screen.getByRole('form', { name: 'signup' }))

    expect(notPrevented).toBe(false)
  })

  it('runs the submit flow when the button is clicked', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { Wrapper } = createFormWrapper<SignupValues>({ email: 'a@b.com' })
    render(<SignupForm onSubmit={onSubmit} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' })
    })
  })
})
