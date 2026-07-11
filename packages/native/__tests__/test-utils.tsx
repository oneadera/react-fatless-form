import type { ReactNode } from 'react'
import { renderHook, type RenderHookResult } from '@testing-library/react'
import {
  FormProvider,
  useForm,
  type FieldBinding,
  type FieldPath,
  type FormValues,
  type UseFormReturn,
} from 'react-fatless-form'

/**
 * A mutable box whose `.current` always points at the most recently rendered
 * `UseFormReturn`. The real `form` instance only exists inside the
 * `Wrapper` component below (React owns it); this lets test bodies read or
 * assert against form-level state (`values`, `errors`, `touched`, ...) from
 * outside that tree.
 */
export interface FormRef<TValues extends FormValues> {
  current: UseFormReturn<TValues>
}

/**
 * Renders `renderCallback` (typically one of this package's field hooks,
 * e.g. `() => useTextField<Values, 'email'>('email')`) inside a real
 * `FormProvider` backed by a real `useForm<TValues>(initialValues)` - not a
 * hand-rolled mock.
 *
 * This package's hooks don't render actual React Native primitives (see
 * babel.config.cjs), so unlike the web package's tests, everything here goes
 * through `renderHook` and the returned handlers (`onChangeText`,
 * `onValueChange`, ...) are called directly rather than through a rendered
 * component tree.
 *
 * Returns the normal `renderHook` result plus a `form` ref (see
 * {@link FormRef}) for asserting against form-level state.
 */
export function renderWithForm<TValues extends FormValues, TResult>(
  renderCallback: () => TResult,
  initialValues: TValues,
): RenderHookResult<TResult, unknown> & { form: FormRef<TValues> } {
  const form = {} as FormRef<TValues>

  function Wrapper({ children }: { children: ReactNode }) {
    const formInstance = useForm<TValues>(initialValues)
    form.current = formInstance
    return <FormProvider form={formInstance}>{children}</FormProvider>
  }

  const view = renderHook(renderCallback, { wrapper: Wrapper })
  return Object.assign(view, { form })
}

/**
 * Builds a hand-crafted {@link FieldBinding}, for unit-testing an
 * `adaptXField` function completely in isolation, with no `FormProvider`/
 * `useForm` involved at all.
 */
export function createFieldBinding<
  TValues extends FormValues,
  TField extends FieldPath<TValues>,
>(overrides: Partial<FieldBinding<TValues, TField>> = {}): FieldBinding<TValues, TField> {
  return {
    name: 'field' as TField,
    value: undefined,
    error: undefined,
    touched: undefined,
    setValue: jest.fn(),
    setTouched: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
    ref: jest.fn(),
    ...overrides,
  }
}
