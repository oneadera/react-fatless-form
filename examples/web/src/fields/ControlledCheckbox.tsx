import { Checkbox, CheckboxProps, FormControlLabel } from '@mui/material'
import { useCheckboxField, FormValues, BooleanFieldPath } from 'react-fatless-form-web'

export interface ControlledCheckboxProps<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues>,
> extends Omit<CheckboxProps, 'name' | 'checked' | 'onChange' | 'slotProps'> {
  name: TField
  label: string
}

/**
 * A boolean-valued field wired to MUI's `Checkbox`. Uses
 * `slotProps.input.ref` (Checkbox's slot for the actual underlying
 * `<input type="checkbox">`, distinct from `TextField`'s `slotProps.htmlInput`)
 * to support `form.setFocus(...)`.
 */
export default function ControlledCheckbox<
  TValues extends FormValues,
  TField extends BooleanFieldPath<TValues> = BooleanFieldPath<TValues>,
>({ name, label, ...props }: ControlledCheckboxProps<TValues, TField>) {
  const { checked, onChange, ref } = useCheckboxField<TValues, TField>(name)

  return (
    <FormControlLabel
      control={
        <Checkbox
          {...props}
          name={name}
          checked={checked}
          onChange={onChange}
          slotProps={{ input: { ref } }}
        />
      }
      label={label}
    />
  )
}
