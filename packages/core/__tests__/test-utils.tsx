import type { ReactNode } from 'react'
import { renderHook, type RenderHookResult } from '@testing-library/react'

import { FormProvider } from '../src/FormProvider'
import type { FormValues, UseFormReturn } from '../src/types'
import { useForm } from '../src/useForm'

/**
 * A mutable box whose `.current` always points at the most recently rendered
 * `UseFormReturn`. Needed because the real `form` instance is only visible
 * inside the `Wrapper` component below (React owns it); this lets test bodies
 * read/assert against form-level state (`values`, `errors`, `touched`, ...)
 * from outside that tree.
 */
export interface FormRef<TValues extends FormValues> {
  current: UseFormReturn<TValues>
}

/**
 * Renders `renderCallback` (typically a hook under test, e.g.
 * `() => useField<Values>('email')`) inside a real `FormProvider` backed by
 * a real `useForm<TValues>(initialValues)` - not a hand-rolled mock.
 *
 * Both `useForm` and the hook under test live in the *same* React tree (the
 * `Wrapper` component), so a state update triggered by the hook under test
 * (e.g. calling `setValue`) re-renders `Wrapper`, which re-renders
 * `FormProvider` with a fresh `form`, which in turn re-renders the hook under
 * test with fresh context - exactly like a real app. Splitting `useForm` and
 * the field hook into two independent `renderHook` calls would NOT do this:
 * they'd be two unrelated React roots, and mutating one's `result.current`
 * would never re-render the other.
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
