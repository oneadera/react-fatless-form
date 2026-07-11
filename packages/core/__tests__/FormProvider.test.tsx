import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'

import { createFormContext } from '../src/createFormContext'
import { useFormContext, useFormProvider } from '../src/FormProvider'
import { useForm } from '../src/useForm'
import { renderWithForm } from './test-utils'

interface SignupValues {
  email: string
}

const initialValues: SignupValues = { email: '' }

/** Render errors are expected in several tests below; keep console output clean. */
function suppressConsoleError() {
  return jest.spyOn(console, 'error').mockImplementation(() => {})
}

describe('useFormContext (default context)', () => {
  it('throws a descriptive error when called outside a FormProvider', () => {
    const spy = suppressConsoleError()

    expect(() => renderHook(() => useFormContext<SignupValues>())).toThrow(
      'useFormContext must be used within a FormProvider.',
    )

    spy.mockRestore()
  })

  it('returns the form supplied by an ancestor FormProvider', () => {
    const { result, form } = renderWithForm(() => useFormContext<SignupValues>(), initialValues)

    expect(result.current).toBe(form.current)
  })

  it('reflects updated form state after a value changes', () => {
    const { result, form } = renderWithForm(() => useFormContext<SignupValues>(), initialValues)

    act(() => {
      form.current.setFieldValue('email', 'a@b.com')
    })

    expect(result.current.values.email).toBe('a@b.com')
  })
})

describe('useFormProvider (default context)', () => {
  it('is the same function as useFormContext (documented alias)', () => {
    expect(useFormProvider).toBe(useFormContext)
  })

  it('returns the form supplied by an ancestor FormProvider', () => {
    const { result, form } = renderWithForm(() => useFormProvider<SignupValues>(), initialValues)

    expect(result.current).toBe(form.current)
  })
})

describe('createFormContext', () => {
  it('returns a matched FormProvider / useFormContext / useFormProvider trio', () => {
    const context = createFormContext<SignupValues>()

    expect(typeof context.FormProvider).toBe('function')
    expect(typeof context.useFormContext).toBe('function')
    expect(typeof context.useFormProvider).toBe('function')
  })

  it('useFormProvider is an alias for useFormContext on the created context too', () => {
    const context = createFormContext<SignupValues>()
    expect(context.useFormProvider).toBe(context.useFormContext)
  })

  it('throws when its useFormContext is used outside its own FormProvider', () => {
    const spy = suppressConsoleError()
    const { useFormContext: useCustomContext } = createFormContext<SignupValues>()

    expect(() => renderHook(() => useCustomContext())).toThrow(
      'useFormContext must be used within a FormProvider.',
    )

    spy.mockRestore()
  })

  it('returns the form supplied by its own FormProvider', () => {
    const { FormProvider: CustomProvider, useFormContext: useCustomContext } =
      createFormContext<SignupValues>()

    const form = { current: null as ReturnType<typeof useCustomContext> | null }
    function Wrapper({ children }: { children: ReactNode }) {
      const formInstance = useForm(initialValues)
      form.current = formInstance
      return <CustomProvider form={formInstance}>{children}</CustomProvider>
    }

    const { result } = renderHook(() => useCustomContext(), { wrapper: Wrapper })

    expect(result.current).toBe(form.current)
  })

  it('is independent from the default FormProvider/useFormContext - the default provider does not satisfy it', () => {
    const spy = suppressConsoleError()
    const { useFormContext: useCustomContext } = createFormContext<SignupValues>()

    // `renderWithForm` wraps in the *default* FormProvider. A hook reading
    // from a separately-created context should still throw, proving the two
    // contexts don't share state.
    expect(() => renderWithForm(() => useCustomContext(), initialValues)).toThrow(
      'useFormContext must be used within a FormProvider.',
    )

    spy.mockRestore()
  })

  it('two independently created contexts do not satisfy one another', () => {
    const spy = suppressConsoleError()
    const contextA = createFormContext<SignupValues>()
    const contextB = createFormContext<SignupValues>()

    function Wrapper({ children }: { children: ReactNode }) {
      const formInstance = useForm(initialValues)
      return <contextA.FormProvider form={formInstance}>{children}</contextA.FormProvider>
    }

    // Reading contextB's hook inside contextA's provider should still throw.
    expect(() =>
      renderHook(() => contextB.useFormContext(), { wrapper: Wrapper }),
    ).toThrow('useFormContext must be used within a FormProvider.')

    spy.mockRestore()
  })
})
