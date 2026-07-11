import { View } from 'react-native'
import { Checkbox, Text } from 'react-native-paper'
import { useSwitchField, FormValues, BooleanFieldPath } from 'react-fatless-form-native'

export interface ControlledCheckboxProps<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues>,
> {
  name: TField
  label: string
}

/**
 * A boolean-valued field wired to react-native-paper's `Checkbox`.
 *
 * `useSwitchField` returns `{ value, onValueChange }` - matching RN core's
 * `Switch` convention - but Paper's `Checkbox` follows Material Design's own
 * convention instead: `status: 'checked' | 'unchecked' | 'indeterminate'`
 * plus `onPress`. This small adapter bridges the two. There's no `ref`
 * wiring here: Paper's `Checkbox` doesn't expose a focusable instance the
 * way its `TextInput` does.
 */
export default function ControlledCheckbox<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues> = BooleanFieldPath<TValues>,
>({ name, label }: ControlledCheckboxProps<TValues, TField>) {
  const { value, onValueChange } = useSwitchField<TValues, TField>(name)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Checkbox
        status={value ? 'checked' : 'unchecked'}
        onPress={() => onValueChange(!value)}
      />
      <Text variant="bodyMedium">{label}</Text>
    </View>
  )
}
