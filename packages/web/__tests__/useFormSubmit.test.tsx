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
  it('calls event.preventDefault()', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result, form } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysValid, onSubmit),
      { email: 'a@b.com' },
    )
    const event = fakeFormEvent()

    // alwaysValid means handleSubmit's fire-and-forget chain runs all the
    // way through (submitting -> onSubmit -> success -> resetForm), not
    // just the synchronous prefix that calls preventDefault(). Waiting for
    // it to settle here matters even though this test only asserts on
    // preventDefault: leaving that chain dangling past the end of the test
    // causes its later updates to land outside any act() scope.
    //
    // A sync act() wraps just the synchronous prefix (calling
    // preventDefault, then the 'submitting' update); waitFor - which wraps
    // its own polling in act() internally - handles the rest on its own.
    // Nesting waitFor inside an *additional* outer act(async () => {...})
    // here previously caused React to lose track of its act environment
    // entirely (updates never committing, waitFor timing out) rather than
    // just warning - so the two are kept separate rather than combined.
    //
    // Waiting on "onSubmit was called" is NOT enough, and was the actual
    // bug behind an earlier round of this same warning: onSubmit(...) is
    // invoked - and recorded by the mock - synchronously, before
    // handleSubmit even suspends on `await onSubmit(...)`. So that
    // assertion passes on the very first poll, before the *later*
    // continuation (updateSubmissionStatus('success'), then resetForm(),
    // which only run once that await resolves) has run at all. Waiting on
    // submissionStatus becoming 'success' is only true once that whole
    // continuation - both calls - has already executed.
    act(() => {
      result.current(event)
    })
    await waitFor(() => {
      expect(form.current.submissionStatus).toBe('success')
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

    // Unlike the alwaysValid case above, validation failure never reaches
    // an `await` - handleSubmit returns synchronously right after marking
    // fields touched, so there's nothing left running to wait for here.
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
    await waitFor(() => {
      expect(form.current.submissionStatus).toBe('success')
    })

    // Safe to assert now that the whole chain has been confirmed settled.
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' })
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
  it('prevents the browser default form submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { Wrapper, form } = createFormWrapper<SignupValues>({ email: 'a@b.com' })
    render(<SignupForm onSubmit={onSubmit} />, { wrapper: Wrapper })

    // fireEvent.X returns the result of the underlying dispatchEvent() call,
    // which is false when a cancelable event had preventDefault() called.
    // fireEvent is already act-wrapped internally for the synchronous
    // portion; waitFor handles the async remainder on its own - see the
    // note in the describe block above for why these are kept separate
    // rather than nested inside one outer act(async () => {...}).
    const notPrevented = fireEvent.submit(screen.getByRole('form', { name: 'signup' }))
    await waitFor(() => {
      expect(form.current.submissionStatus).toBe('success')
    })

    expect(notPrevented).toBe(false)
  })

  it('runs the submit flow when the button is clicked', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { Wrapper, form } = createFormWrapper<SignupValues>({ email: 'a@b.com' })
    render(<SignupForm onSubmit={onSubmit} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    await waitFor(() => {
      expect(form.current.submissionStatus).toBe('success')
    })

    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' })
  })
})
