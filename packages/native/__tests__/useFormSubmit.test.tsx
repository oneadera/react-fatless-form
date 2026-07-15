import { act, waitFor } from '@testing-library/react'
import { Keyboard } from 'react-native'
import type { ValidationResolver } from 'react-fatless-form'

import { useFormSubmit } from '../src/useFormSubmit'
import { renderWithForm } from './test-utils'

// `react-native` itself is never really loaded: this package's own source
// only ever touches one export from it (`Keyboard.dismiss`, in
// useFormSubmit.ts), so a `virtual` mock covers exactly what's needed
// without requiring the real package (and its Flow-syntax internals, native
// bindings, and the RN-specific Jest/babel preset) to be present at all.
// `virtual: true` also means this works regardless of whether `react-native`
// actually finished installing in a given environment.
jest.mock(
  'react-native',
  () => ({
    Keyboard: { dismiss: jest.fn() },
  }),
  { virtual: true },
)

interface SignupValues {
  email: string
}

const alwaysValid: ValidationResolver<SignupValues> = () => ({})
const alwaysInvalid: ValidationResolver<SignupValues> = () => ({ email: 'Required' })

describe('useFormSubmit', () => {
  it('dismisses the keyboard', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result, form } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysValid, onSubmit),
      { email: 'a@b.com' },
    )

    // alwaysValid means handleSubmit's fire-and-forget chain runs all the
    // way through (submitting -> onSubmit -> success -> resetForm), not
    // just the synchronous prefix. Waiting for it to settle here matters
    // even though this test only asserts on Keyboard.dismiss: leaving that
    // chain dangling past the end of the test causes its later updates to
    // land outside any act() scope.
    //
    // Waiting on "onSubmit was called" is NOT enough, and was the actual
    // bug behind an earlier round of this same warning: onSubmit(...) is
    // invoked - and recorded by the mock - synchronously, before handleSubmit
    // even suspends on `await onSubmit(...)`. So that assertion passes on
    // the very first poll, closing this act() scope before the *later*
    // continuation (updateSubmissionStatus('success'), then resetForm(),
    // which only run after that await resolves) has run at all. Waiting on
    // submissionStatus becoming 'success' is only true once that whole
    // continuation - both calls - has already executed synchronously.
    await act(async () => {
      result.current()
      await waitFor(() => {
        expect(form.current.submissionStatus).toBe('success')
      })
    })

    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses the keyboard even when validation will fail', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysInvalid, onSubmit),
      { email: '' },
    )

    act(() => {
      result.current()
    })

    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
  })

  it('wires through to a real submit flow - onSubmit is eventually called with the form values', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result, form } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysValid, onSubmit),
      { email: 'a@b.com' },
    )

    await act(async () => {
      result.current()
      await waitFor(() => {
        expect(form.current.submissionStatus).toBe('success')
      })
    })

    // Safe to assert now that the whole chain (including the reset that
    // follows success) has been confirmed to have settled above.
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
      result.current()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('marks invalid fields touched on a failed validation, same as core handleSubmit', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const { result, form } = renderWithForm(
      () => useFormSubmit<SignupValues>(alwaysInvalid, onSubmit),
      { email: '' },
    )

    act(() => {
      result.current()
    })

    expect(form.current.touched.email).toBe(true)
  })
})
