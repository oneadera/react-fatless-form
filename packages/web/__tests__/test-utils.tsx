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
 * Builds a `Wrapper` component that renders a real `useForm<TValues>(initialValues)`
 * inside a `FormProvider`, plus a `form` ref (see {@link FormRef}) that always points
 * at the latest `UseFormReturn`. `Wrapper` is compatible with both `renderHook`'s and
 * `render`'s `wrapper` option, so it works whether you're testing a hook directly or
 * rendering a real component tree (e.g. an actual `<input>` for a DOM round-trip test).
 */
export function createFormWrapper<TValues extends FormValues>(initialValues: TValues) {
  const form = {} as FormRef<TValues>

  function Wrapper({ children }: { children: ReactNode }) {
    const formInstance = useForm<TValues>(initialValues)
    form.current = formInstance
    return <FormProvider form={formInstance}>{children}</FormProvider>
  }

  return { Wrapper, form }
}

/**
 * Renders `renderCallback` (typically one of this package's field hooks,
 * e.g. `() => useTextField<Values, 'email'>('email')`) inside a real
 * `FormProvider` backed by a real `useForm<TValues>(initialValues)` - not a
 * hand-rolled mock.
 *
 * `useForm` and the hook under test deliberately live in the *same* React
 * tree (the `Wrapper` component from {@link createFormWrapper}), so a state
 * update triggered by the hook under test re-renders `Wrapper`, which
 * re-renders `FormProvider` with a fresh `form`, which re-renders the hook
 * under test with fresh context - exactly like a real app. Two independent
 * `renderHook` calls (one for `useForm`, one wrapped separately) would NOT
 * do this, since they'd be unrelated React roots.
 *
 * Returns the normal `renderHook` result plus a `form` ref (see
 * {@link FormRef}) for asserting against form-level state.
 */
export function renderWithForm<TValues extends FormValues, TResult>(
  renderCallback: () => TResult,
  initialValues: TValues,
): RenderHookResult<TResult, unknown> & { form: FormRef<TValues> } {
  const { Wrapper, form } = createFormWrapper(initialValues)
  const view = renderHook(renderCallback, { wrapper: Wrapper })
  return Object.assign(view, { form })
}

/**
 * Builds a hand-crafted {@link FieldBinding}, for unit-testing an
 * `adaptXField` function (e.g. `adaptTextField`) completely in isolation,
 * with no `FormProvider`/`useForm` involved at all. `setValue`, `setTouched`,
 * `onBlur`, `onFocus`, and `ref` are `jest.fn()` mocks - assert on them
 * directly to confirm an adapter's `onChange`/`onBlur`/etc. call through to
 * the right underlying binding method with the right argument.
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
