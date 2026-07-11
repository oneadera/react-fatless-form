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
import { useForm, FormProvider, useTextField, useSwitchField, useFormSubmit, yupResolver } from 'react-fatless-form-native'
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
  const onSubmit = useFormSubmit<SignupValues>(yupResolver(schema), async (values) => {
    await api.signup(values)
  })

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

Wraps `handleSubmit` for a native submit button: dismisses the keyboard via `Keyboard.dismiss()` before running the validate → submit → update-status flow.

```tsx
const onSubmit = useFormSubmit(yupResolver(schema), async (values) => {
  await api.signup(values)
}, {
  onSuccess: () => navigation.navigate('Welcome'),
})
<Button title="Sign up" onPress={onSubmit} />
```

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
