# react-fatless-form-web

![License](https://img.shields.io/github/license/aderahenry/react-fatless-form) ![npm version](https://img.shields.io/npm/v/react-fatless-form-web) ![bundle size](https://img.shields.io/bundlephobia/minzip/react-fatless-form-web)

Web (DOM) bindings for [`react-fatless-form`](../core/README.md). This is the only package a web app needs - every core export (`useForm`, `FormProvider`, `useFormContext`, `handleSubmit`, `yupResolver`, the field-path type machinery, etc.) is re-exported here unchanged, alongside the DOM-specific hooks documented below.

What this package adds on top of core: unwrapping DOM events (`event.target.value`, `.checked`, `.valueAsNumber`, `.selectedOptions`, `.files`) into the plain values core expects, and handling `<form>` submission (`event.preventDefault()`). None of that DOM-event handling leaks into your own components - that's what this package is for.

---

## Install

```sh
npm install react-fatless-form-web
```

```sh
yarn add react-fatless-form-web
```

```sh
pnpm add react-fatless-form-web
```

```sh
bun add react-fatless-form-web
```

`react-fatless-form` comes along as a dependency automatically. If you use `yupResolver`, also install `yup`:

```sh
npm install yup
```

---

## Quick start

```tsx
import { useForm, FormProvider, handleSubmit, useTextField, useCheckboxField, yupResolver } from 'react-fatless-form-web'
import * as yup from 'yup'

interface SignupValues {
  email: string
  remember: boolean
}

const schema = yup.object<SignupValues>({
  email: yup.string().email().required('Enter a valid email'),
  remember: yup.boolean().required(),
})

function SignupForm() {
  const form = useForm<SignupValues>({ email: '', remember: false })

  return (
    <FormProvider form={form}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit(form, yupResolver(schema), async (values) => {
            await api.signup(values)
          })
        }}
      >
        <EmailField />
        <RememberCheckbox />
        <button type="submit" disabled={form.submissionStatus === 'submitting'}>
          Sign up
        </button>
      </form>
    </FormProvider>
  )
}

function EmailField() {
  const { value, onChange, onBlur, touched, error } = useTextField<SignupValues>('email')
  return (
    <div>
      <input value={value} onChange={onChange} onBlur={onBlur} />
      {touched && error && <span>{error}</span>}
    </div>
  )
}

function RememberCheckbox() {
  const { checked, onChange } = useCheckboxField<SignupValues>('remember')
  return <input type="checkbox" checked={checked} onChange={onChange} />
}
```

`handleSubmit` takes `form` directly, so it works from any component with no structural requirements - which is why it's what you see above. Once your fields and submit button live together under one `FormProvider` (the common shape, and what the [example app](../../examples/web/src/SignupForm.tsx) shows), `useFormSubmit` further down is a slightly more ergonomic wrapper around the same flow, at the cost of one structural rule worth knowing about first - see its section below.

---

## API

Every hook takes your values type explicitly - `useTextField<SignupValues>('email')` - and narrows the field path from the literal you pass. Passing a field that doesn't exist on `TValues`, or one of the wrong value type, is a compile error.

### `useTextField<TValues>(name)`

Binds a **string-valued** field to `<input>` or `<textarea>`. `value` is always a `string` - never `undefined`.

```tsx
const { value, onChange, onBlur, touched, error, ref } = useTextField<SignupValues>('email')
<input ref={ref} value={value} onChange={onChange} onBlur={onBlur} />
```

### `useNumberField<TValues>(name)`

Binds a **number-valued** field to `<input type="number">`. Parses on commit; ignores mid-typing partial input (e.g. a lone `-`). Commits `null` on clear.

```tsx
const { value, onChange, ref } = useNumberField<ProfileValues>('age')
<input type="number" ref={ref} value={value} onChange={onChange} />
```

### `useCheckboxField<TValues>(name)`

Binds a **boolean-valued** field to `<input type="checkbox">`. Returns `checked`, not `value`. Marks touched immediately on change.

```tsx
const { checked, onChange, ref } = useCheckboxField<SignupValues>('remember')
<input type="checkbox" ref={ref} checked={checked} onChange={onChange} />
```

### `useSelectField<TValues>(name)` - single selection

Binds a **string-valued** field to `<select>` (single selection). Reads `event.target.value`.

```tsx
const { value, onChange, ref } = useSelectField<SignupValues>('country')
<select ref={ref} value={value} onChange={onChange}>
  <option value="ke">Kenya</option>
  <option value="ng">Nigeria</option>
</select>
```

### `useMultiSelectField<TValues>(name)` - multiple selection

Binds a **`string[]`-valued** field to `<select multiple>`. Reads `event.target.selectedOptions` - not `event.target.value`, which only gives the last interacted option and silently loses all others.

```tsx
const { value, onChange } = useMultiSelectField<SignupValues>('countries')
<select multiple value={[...value]} onChange={onChange}>
  <option value="ke">Kenya</option>
  <option value="ng">Nigeria</option>
  <option value="et">Ethiopia</option>
</select>
```

### `useCheckboxGroupItem<TValues>(name, itemValue)` - checkbox groups

Binds one checkbox within a group where all checkboxes share a **`string[]`-valued** field. Each call gets the checked state and toggle handler for its specific `itemValue`.

```tsx
// All three share the 'preferences' field; each has its own item value
const email = useCheckboxGroupItem<FormValues>('preferences', 'email')
const sms   = useCheckboxGroupItem<FormValues>('preferences', 'sms')

<input type="checkbox" checked={email.checked} onChange={email.onChange} />
<input type="checkbox" checked={sms.checked}   onChange={sms.onChange} />
```

> **Note:** For a single yes/no checkbox, use `useCheckboxField` instead (`boolean` field). `useCheckboxGroupItem` is for the "select all that apply" pattern.

### Radio buttons

Use `useTextField` directly - radio buttons surface their value through `event.target.value` identically to text inputs. There is no separate `useRadioField`.

```tsx
const { value, onChange } = useTextField<FormValues>('plan')
<input type="radio" value="free" checked={value === 'free'} onChange={onChange} />
<input type="radio" value="pro"  checked={value === 'pro'}  onChange={onChange} />
```

### `useFileField<TValues>(name)`

Binds a **`File[]`-typed** field to `<input type="file">` (single or multiple). Returns `value` as `File[]` (never `FileList`, never `null`). Declare the field as `File[]` in your interface:

```ts
interface UploadValues { resume: File[] }
const form = useForm<UploadValues>({ resume: [] })
```

```tsx
const { value, onChange, touched, error } = useFileField<UploadValues>('resume')
// Note: don't bind `value` on a file input - browsers block it for security
<input type="file" accept=".pdf" multiple onChange={onChange} />
{value.length > 0 && <span>{value.length} file(s) selected</span>}
```

### `useFormSubmit<TValues>(resolver, onSubmit, config?)`

Wraps `handleSubmit` for `<form>`: calls `event.preventDefault()`, then validates and submits - a slightly more ergonomic alternative to calling `handleSubmit` yourself, for the common case where your fields and submit button live together under one `FormProvider`.

Reads the form from context, so **it must be called by a component rendered inside `FormProvider`, not the component that creates `FormProvider`.** A component can never be a descendant of a provider it renders itself, no matter how the JSX is arranged - context only flows to *other* components nested inside it. The usual shape is to split the piece that owns `useForm`/`FormProvider` from the piece with the `<form>` and submit button:

```tsx
function SignupForm() {
  const form = useForm<SignupValues>({ email: '', remember: false })
  return (
    <FormProvider form={form}>
      <SignupFormFields />
    </FormProvider>
  )
}

function SignupFormFields() {
  const onSubmit = useFormSubmit(yupResolver(schema), async (values) => {
    await api.signup(values)
  }, {
    onSuccess: () => navigate('/welcome'),
    onError: (err) => toast.error('Something went wrong'),
  })

  return <form onSubmit={onSubmit}>...</form>
}
```

If your submit trigger can't be structured that way - e.g. it needs values or callbacks from somewhere outside the `FormProvider` subtree - call `handleSubmit` from [`react-fatless-form`](../core/README.md) directly instead, exactly as in [Quick start](#quick-start) above. See [the example app](../../examples/web/src/SignupForm.tsx) for this pattern in full, wired up to real fields and validation.

### Jumping focus between fields

Every field hook returns a `ref`. Wire it to the element, then call `form.setFocus('fieldName')`:

```tsx
function EmailInput() {
  const form = useFormContext<SignupValues>()
  const { value, onChange, ref } = useTextField<SignupValues>('email')
  return (
    <input
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={(e) => { if (e.key === 'Enter') form.setFocus('password') }}
    />
  )
}
```

### Custom form contexts

The `adapt*` functions (`adaptTextField`, `adaptSelectField`, etc.) are exported alongside the hooks. If you're using a custom form context via `createUseField`, you can still get the DOM adapters:

```tsx
const useCheckoutField = createUseField(useCheckoutFormContext)
function useCheckoutTextField<TField extends StringFieldPath<CheckoutValues>>(name: TField) {
  return adaptTextField(useCheckoutField(name))
}
```

---

## Example

See [`examples/web`](../../examples/web) for a complete signup form using [MUI](https://mui.com).

---

## License

MIT
