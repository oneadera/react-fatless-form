# react-fatless-form-native

![License](https://img.shields.io/github/license/aderahenry/react-fatless-form) ![npm version](https://img.shields.io/npm/v/react-fatless-form-native) ![bundle size](https://img.shields.io/bundlephobia/minzip/react-fatless-form-native)

React Native bindings for [`react-fatless-form`](../core/README.md). This is the only package a native app needs - every core export (`useForm`, `FormProvider`, `useFormContext`, `handleSubmit`, `yupResolver`, etc.) is re-exported here unchanged, alongside the RN-specific hooks documented below.

No DOM here whatsoever - no `ChangeEvent`, no `event.target`, no `preventDefault`. That's [`react-fatless-form-web`](../web/README.md)'s job, and the two never import each other.

---

## Install

```sh
npm install react-fatless-form-native
```

```sh
yarn add react-fatless-form-native
```

```sh
pnpm add react-fatless-form-native
```

```sh
bun add react-fatless-form-native
```

`react-fatless-form` comes along as a dependency automatically. If you use `yupResolver`, also install `yup`:

```sh
npm install yup
```

---

## Quick start

```tsx
import { View, Button } from 'react-native'
import { useForm, FormProvider, handleSubmit, useTextField, useSwitchField, yupResolver } from 'react-fatless-form-native'
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

  const onSubmit = () => {
    void handleSubmit(form, yupResolver(schema), async (values) => {
      await api.signup(values)
    })
  }

  return (
    <FormProvider form={form}>
      <EmailField />
      <RememberSwitch />
      <Button title="Sign up" onPress={onSubmit} />
    </FormProvider>
  )
}

function EmailField() {
  const { value, onChangeText, onBlur, touched, error } = useTextField<SignupValues>('email')
  return (
    <View>
      <TextInput value={value} onChangeText={onChangeText} onBlur={onBlur} />
      {touched && error ? <Text>{error}</Text> : null}
    </View>
  )
}

function RememberSwitch() {
  const { value, onValueChange } = useSwitchField<SignupValues>('remember')
  return <Switch value={value} onValueChange={onValueChange} />
}
```

`handleSubmit` takes `form` directly, so it works from any component with no structural requirements - which is why it's what you see above. Once your fields and submit button live together under one `FormProvider` (the common shape, and what the [example app](../../examples/native/src/SignupForm.tsx) shows), `useFormSubmit` further down is a slightly more ergonomic wrapper around the same flow, at the cost of one structural rule worth knowing about first - see its section below.

---

## API

Every hook takes your values type explicitly - `useTextField<SignupValues>('email')` - and narrows the field path from the literal you pass. Passing a field that doesn't exist on `TValues`, or one of the wrong value type, is a compile error.

### `useTextField<TValues>(name)`

Binds a **string-valued** field to RN's `<TextInput>`. Returns `onChangeText` (not `onChange`) - RN's `TextInput` already hands back a plain string, so there's nothing to unwrap. `value` is always a `string`.

```tsx
const { value, onChangeText, onBlur, touched, error, ref } = useTextField<SignupValues>('email')
<TextInput ref={ref} value={value} onChangeText={onChangeText} onBlur={onBlur} />
```

### `useNumberField<TValues>(name)`

Binds a **number-valued** field to `<TextInput keyboardType="numeric">`. `value` is the display string; parsing happens on commit. Commits `null` on clear.

```tsx
const { value, onChangeText, ref } = useNumberField<ProfileValues>('age')
<TextInput keyboardType="numeric" ref={ref} value={value} onChangeText={onChangeText} />
```

### `useSwitchField<TValues>(name)`

Binds a **boolean-valued** field to RN's `<Switch>`. Returns `onValueChange`, not `onChange`. Marks touched immediately on change - a switch has no meaningful blur on touch devices.

```tsx
const { value, onValueChange } = useSwitchField<SignupValues>('remember')
<Switch value={value} onValueChange={onValueChange} />
```

### `useFormSubmit<TValues>(resolver, onSubmit, config?)`

Wraps `handleSubmit` for a native submit button: dismisses the keyboard via `Keyboard.dismiss()` before running the validate → submit → update-status flow - a slightly more ergonomic alternative to calling `handleSubmit` yourself, for the common case where your fields and submit button live together under one `FormProvider`.

Reads the form from context, so **it must be called by a component rendered inside `FormProvider`, not the component that creates `FormProvider`.** A component can never be a descendant of a provider it renders itself, no matter how the JSX is arranged - context only flows to *other* components nested inside it. The usual shape is to split the piece that owns `useForm`/`FormProvider` from the piece with the submit button:

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
    onSuccess: () => navigation.navigate('Welcome'),
  })

  return <Button title="Sign up" onPress={onSubmit} />
}
```

If your submit trigger can't be structured that way - e.g. it needs values or callbacks from somewhere outside the `FormProvider` subtree - call `handleSubmit` from [`react-fatless-form`](../core/README.md) directly instead, exactly as in [Quick start](#quick-start) above (call `Keyboard.dismiss()` yourself if you still want that behavior). See [the example app](../../examples/native/src/SignupForm.tsx) for this pattern in full, wired up to real fields and validation.

### Jumping focus between fields (`returnKeyType` + `setFocus`)

Wire each field's `ref` to `<TextInput>`, then call `form.setFocus('fieldName')` from `onSubmitEditing`. The keyboard's return key moves through the form without the user tapping each field.

```tsx
function FirstNameInput() {
  const form = useFormContext<SignupValues>()
  const { value, onChangeText, ref } = useTextField<SignupValues>('firstName')
  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="next"
      submitBehavior="submit"
      onSubmitEditing={() => form.setFocus('lastName')}
    />
  )
}
```

### What about select, radio, and file inputs?

React Native has no built-in equivalents. These are always design-system problems, not form-state problems:

- **Select/dropdown** - `@react-native-picker/picker`, React Native Paper `Menu`, or a custom bottom-sheet. Wire via `useField` directly: `field.setValue(newValue)`.
- **Radio buttons** - your design system provides the component. Wire via `useField`.
- **File/image picker** - `expo-document-picker` or `expo-image-picker`. Wire via `useField` with a value type matching what the picker returns.

The web package exports `useSelectField`, `useMultiSelectField`, and `useFileField` because `<select>` and `<input type="file">` are standard HTML with a consistent event shape. Native has no such equivalent.

### Custom form contexts

The `adapt*` functions are exported alongside the hooks. If you're using a custom form context via `createUseField`, you can still get the RN adapters:

```tsx
const useCheckoutField = createUseField(useCheckoutFormContext)
function useCheckoutTextField<TField extends StringFieldPath<CheckoutValues>>(name: TField) {
  return adaptTextField(useCheckoutField(name))
}
```

---

## Example

See [`examples/native`](../../examples/native) for a complete signup form using [React Native Paper](https://callstack.github.io/react-native-paper/) via Expo.

---

## License

MIT
