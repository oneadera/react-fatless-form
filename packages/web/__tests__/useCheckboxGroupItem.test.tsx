import { fireEvent, render, screen } from '@testing-library/react'

import { adaptCheckboxGroupItem, useCheckboxGroupItem } from '../src/useCheckboxGroupItem'
import { createFieldBinding, createFormWrapper, renderWithForm } from './test-utils'

interface PreferencesValues {
  channels: string[]
}

describe('adaptCheckboxGroupItem - checked', () => {
  it('is true when itemValue is present in the current array', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({ value: ['email', 'sms'] })
    expect(adaptCheckboxGroupItem(field, 'email').checked).toBe(true)
  })

  it('is false when itemValue is not present', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({ value: ['email'] })
    expect(adaptCheckboxGroupItem(field, 'sms').checked).toBe(false)
  })

  it('is false when the field value is undefined', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({ value: undefined })
    expect(adaptCheckboxGroupItem(field, 'email').checked).toBe(false)
  })
})

describe('adaptCheckboxGroupItem - onChange', () => {
  it('adds itemValue to the array when not currently checked', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({
      value: ['email'],
      touched: true,
    })
    adaptCheckboxGroupItem(field, 'sms').onChange()
    expect(field.setValue).toHaveBeenCalledWith(['email', 'sms'])
  })

  it('removes itemValue from the array when currently checked, keeping the rest', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({
      value: ['email', 'sms', 'push'],
      touched: true,
    })
    adaptCheckboxGroupItem(field, 'sms').onChange()
    expect(field.setValue).toHaveBeenCalledWith(['email', 'push'])
  })

  it('adds to an initially-undefined array', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({
      value: undefined,
      touched: true,
    })
    adaptCheckboxGroupItem(field, 'email').onChange()
    expect(field.setValue).toHaveBeenCalledWith(['email'])
  })

  it('marks the field touched immediately on change when not already touched', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({
      value: [],
      touched: undefined,
    })
    adaptCheckboxGroupItem(field, 'email').onChange()
    expect(field.setTouched).toHaveBeenCalledWith(true)
  })

  it('does not call setTouched again once already touched', () => {
    const field = createFieldBinding<PreferencesValues, 'channels'>({
      value: [],
      touched: true,
    })
    adaptCheckboxGroupItem(field, 'email').onChange()
    expect(field.setTouched).not.toHaveBeenCalled()
  })
})

describe('useCheckboxGroupItem', () => {
  it('reflects whether its item is present in the shared array field', () => {
    const { result } = renderWithForm(
      () => useCheckboxGroupItem<PreferencesValues>('channels', 'sms'),
      { channels: ['sms'] },
    )
    expect(result.current.checked).toBe(true)
  })
})

function ChannelPreferences() {
  const email = useCheckboxGroupItem<PreferencesValues>('channels', 'email')
  const sms = useCheckboxGroupItem<PreferencesValues>('channels', 'sms')
  const push = useCheckboxGroupItem<PreferencesValues>('channels', 'push')

  return (
    <fieldset>
      <label>
        <input
          aria-label="email"
          type="checkbox"
          checked={email.checked}
          onChange={email.onChange}
        />
        Email
      </label>
      <label>
        <input aria-label="sms" type="checkbox" checked={sms.checked} onChange={sms.onChange} />
        SMS
      </label>
      <label>
        <input
          aria-label="push"
          type="checkbox"
          checked={push.checked}
          onChange={push.onChange}
        />
        Push
      </label>
    </fieldset>
  )
}

describe('useCheckboxGroupItem - end-to-end DOM round trip (select all that apply)', () => {
  it('checking two independent checkboxes builds up the shared array field', () => {
    const { Wrapper, form } = createFormWrapper<PreferencesValues>({ channels: [] })
    render(<ChannelPreferences />, { wrapper: Wrapper })

    fireEvent.click(screen.getByLabelText('email'))
    fireEvent.click(screen.getByLabelText('push'))

    expect(form.current.values.channels).toEqual(['email', 'push'])
  })

  it('unchecking one item removes only that value, leaving its siblings', () => {
    const { Wrapper, form } = createFormWrapper<PreferencesValues>({
      channels: ['email', 'sms', 'push'],
    })
    render(<ChannelPreferences />, { wrapper: Wrapper })

    fireEvent.click(screen.getByLabelText('sms'))

    expect(form.current.values.channels).toEqual(['email', 'push'])
  })
})
