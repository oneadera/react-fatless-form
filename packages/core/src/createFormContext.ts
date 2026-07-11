import {
  createContext,
  createElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react'

import { FormContextApi, FormValues, UseFormReturn } from './types'

/**
 * Creates a dedicated, fully-typed form context: a matched `FormProvider` /
 * `useFormContext` / `useFormProvider` trio that all share one React
 * Context.
 *
 * Most apps don't need this directly - the package's default export
 * (`FormProvider`/`useFormContext` from the package root) already covers
 * the common case of "one shared form context," and its hooks already
 * accept an explicit type argument per call (`useFormContext<MyValues>()`).
 * Reach for `createFormContext` when you want a **separate, independent**
 * context instead - e.g. two unrelated forms rendering at once that should
 * never accidentally read each other's context value, or a context
 * dedicated to one specific form shape so you don't have to repeat the
 * type argument at every call site.
 *
 * @typeParam TDefaultValues - The type each returned hook resolves to when called with
 * no explicit type argument. Every hook can still be called with its own type argument
 * to override this per call.
 *
 * @example
 * ```tsx
 * interface CheckoutValues {
 *   cardNumber: string
 *   expiry: string
 * }
 *
 * const {
 *   FormProvider: CheckoutFormProvider,
 *   useFormContext: useCheckoutFormContext,
 * } = createFormContext<CheckoutValues>()
 *
 * function Checkout() {
 *   const form = useForm<CheckoutValues>({ cardNumber: '', expiry: '' })
 *   return (
 *     <CheckoutFormProvider form={form}>
 *       <CardNumberField />
 *     </CheckoutFormProvider>
 *   )
 * }
 *
 * function CardNumberField() {
 *   const form = useCheckoutFormContext() // already typed as CheckoutValues
 *   return <input value={form.values.cardNumber} readOnly />
 * }
 * ```
 */
export function createFormContext<
  TDefaultValues extends FormValues = FormValues,
>(): FormContextApi<TDefaultValues> {
  const FormContext = createContext<UseFormReturn<FormValues> | null>(null)
  FormContext.displayName = 'FormContext'

  function FormProvider<TValues extends FormValues = TDefaultValues>({
    form,
    children,
  }: {
    form: UseFormReturn<TValues>
    children: ReactNode
  }): ReactElement {
    return createElement(
      FormContext.Provider,
      { value: form as unknown as UseFormReturn<FormValues> },
      children,
    )
  }

  function useFormContext<
    TValues extends FormValues = TDefaultValues,
  >(): UseFormReturn<TValues> {
    const context = useContext(FormContext)

    if (context === null) {
      throw new Error('useFormContext must be used within a FormProvider.')
    }

    return context as unknown as UseFormReturn<TValues>
  }

  return {
    FormProvider,
    useFormContext,
    useFormProvider: useFormContext,
  }
}
