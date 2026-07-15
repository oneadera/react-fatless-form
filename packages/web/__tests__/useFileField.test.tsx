import type { ChangeEvent } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { adaptFileField, useFileField } from '../src/useFileField'
import { createFieldBinding, createFormWrapper, renderWithForm } from './test-utils'

interface UploadValues {
  resume: File[]
}

function makeFile(name: string, content = 'content') {
  return new File([content], name, { type: 'application/pdf' })
}

function fileChangeEvent(files: File[] | null) {
  return { target: { files } } as unknown as ChangeEvent<HTMLInputElement>
}

describe('adaptFileField - value display', () => {
  it('falls back to an empty array when the field value is undefined', () => {
    const field = createFieldBinding<UploadValues, 'resume'>({ value: undefined })
    expect(adaptFileField(field).value).toEqual([])
  })

  it('passes a real File[] value through unchanged', () => {
    const file = makeFile('resume.pdf')
    const field = createFieldBinding<UploadValues, 'resume'>({ value: [file] })
    expect(adaptFileField(field).value).toEqual([file])
  })
})

describe('adaptFileField - onChange', () => {
  it('converts a FileList-like value into a plain File[]', () => {
    const file1 = makeFile('resume.pdf')
    const file2 = makeFile('cover-letter.pdf')
    const field = createFieldBinding<UploadValues, 'resume'>({ touched: true })

    adaptFileField(field).onChange(fileChangeEvent([file1, file2]))

    expect(field.setValue).toHaveBeenCalledWith([file1, file2])
  })

  it('commits an empty array when event.target.files is null', () => {
    const field = createFieldBinding<UploadValues, 'resume'>({ touched: true })
    adaptFileField(field).onChange(fileChangeEvent(null))
    expect(field.setValue).toHaveBeenCalledWith([])
  })

  it('marks the field touched immediately on change when not already touched', () => {
    const field = createFieldBinding<UploadValues, 'resume'>({ touched: undefined })
    adaptFileField(field).onChange(fileChangeEvent([makeFile('resume.pdf')]))
    expect(field.setTouched).toHaveBeenCalledWith(true)
  })

  it('does not call setTouched again once already touched', () => {
    const field = createFieldBinding<UploadValues, 'resume'>({ touched: true })
    adaptFileField(field).onChange(fileChangeEvent([makeFile('resume.pdf')]))
    expect(field.setTouched).not.toHaveBeenCalled()
  })
})

describe('adaptFileField - passthrough', () => {
  it('echoes the field name', () => {
    const field = createFieldBinding<UploadValues, 'resume'>({ name: 'resume' })
    expect(adaptFileField(field).name).toBe('resume')
  })

  it('passes error and touched through unchanged', () => {
    const field = createFieldBinding<UploadValues, 'resume'>({
      error: 'File too large',
      touched: true,
    })
    const props = adaptFileField(field)
    expect(props.error).toBe('File too large')
    expect(props.touched).toBe(true)
  })

  it('passes onBlur through as the same function reference', () => {
    const field = createFieldBinding<UploadValues, 'resume'>()
    expect(adaptFileField(field).onBlur).toBe(field.onBlur)
  })

  it('does not expose onFocus or ref - file inputs are almost always visually hidden', () => {
    const field = createFieldBinding<UploadValues, 'resume'>()
    const props = adaptFileField(field)
    expect(props).not.toHaveProperty('onFocus')
    expect(props).not.toHaveProperty('ref')
  })
})

describe('useFileField', () => {
  it('starts with an empty file array', () => {
    const { result } = renderWithForm(() => useFileField<UploadValues>('resume'), {
      resume: [],
    })
    expect(result.current.value).toEqual([])
  })
})

function ResumeUpload() {
  const { value, onChange } = useFileField<UploadValues>('resume')
  return (
    <div>
      <input aria-label="resume" type="file" multiple onChange={onChange} />
      <span>{value.length} file(s) selected</span>
    </div>
  )
}

describe('useFileField - end-to-end DOM round trip', () => {
  it('uploading a file through a real <input type="file"> updates the form value', async () => {
    const { Wrapper, form } = createFormWrapper<UploadValues>({ resume: [] })
    render(<ResumeUpload />, { wrapper: Wrapper })
    const user = userEvent.setup()

    const file = makeFile('resume.pdf')
    await user.upload(screen.getByLabelText('resume'), file)

    expect(form.current.values.resume).toEqual([file])
    expect(screen.getByText('1 file(s) selected')).toBeInTheDocument()
  })
})
