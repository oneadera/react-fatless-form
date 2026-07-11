import * as yup from 'yup'

import { yupResolver } from '../src/validation'

describe('yupResolver', () => {
  it('returns an empty errors object when validation passes', () => {
    const schema = yup.object({
      email: yup.string().email().required(),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ email: 'a@b.com' })).toEqual({})
  })

  it('maps a single required-field error to that field path', () => {
    const schema = yup.object({
      email: yup.string().required('Email is required'),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ email: '' })).toEqual({ email: 'Email is required' })
  })

  it('collects errors from multiple different fields (abortEarly defaults to false)', () => {
    const schema = yup.object({
      email: yup.string().required('Email is required'),
      password: yup.string().min(8, 'Password too short').required(),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ email: '', password: '123' })).toEqual({
      email: 'Email is required',
      password: 'Password too short',
    })
  })

  it('only reports the first error when abortEarly is explicitly true', () => {
    const schema = yup.object({
      email: yup.string().required('Email is required'),
      password: yup.string().min(8, 'Password too short').required(),
    })
    const resolver = yupResolver(schema, true)

    const errors = resolver({ email: '', password: '123' })
    expect(Object.keys(errors)).toHaveLength(1)
  })

  it('uses a dot path for a nested object field error', () => {
    const schema = yup.object({
      address: yup.object({
        street: yup.string().required('Street is required'),
      }),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ address: { street: '' } })).toEqual({
      'address.street': 'Street is required',
    })
  })

  it('normalizes an array item field error from bracket to dot notation', () => {
    const schema = yup.object({
      items: yup.array().of(
        yup.object({
          name: yup.string().required('Name is required'),
        }),
      ),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ items: [{ name: '' }] })).toEqual({
      'items.0.name': 'Name is required',
    })
  })

  it('normalizes an error for the second item in an array', () => {
    const schema = yup.object({
      items: yup.array().of(
        yup.object({
          name: yup.string().required('Name is required'),
        }),
      ),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ items: [{ name: 'ok' }, { name: '' }] })).toEqual({
      'items.1.name': 'Name is required',
    })
  })

  it('reports no errors for a fully valid, deeply nested value', () => {
    const schema = yup.object({
      address: yup.object({
        street: yup.string().required(),
        city: yup.string().required(),
      }),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ address: { street: '123 Main St', city: 'Nairobi' } })).toEqual({})
  })

  it('preserves the exact custom message text from the schema', () => {
    const schema = yup.object({
      age: yup.number().min(18, 'You must be at least 18 years old'),
    })
    const resolver = yupResolver(schema)

    expect(resolver({ age: 10 })).toEqual({ age: 'You must be at least 18 years old' })
  })

  it('rethrows an error that does not look like a yup ValidationError', () => {
    const boomError = new Error('schema itself is broken')
    const schema = {
      validateSync: () => {
        throw boomError
      },
    } as unknown as yup.ObjectSchema<{ email: string }>
    const resolver = yupResolver(schema)

    expect(() => resolver({ email: '' })).toThrow('schema itself is broken')
  })

  it('defaults abortEarly to false when not provided', () => {
    const schema = yup.object({
      a: yup.string().required('a required'),
      b: yup.string().required('b required'),
    })
    const errors = yupResolver(schema)({ a: '', b: '' })

    expect(Object.keys(errors).sort()).toEqual(['a', 'b'])
  })

  it('validates synchronously - the resolver return value is available immediately, no await needed', () => {
    const schema = yup.object({ email: yup.string().required() })
    const resolver = yupResolver(schema)

    const result = resolver({ email: '' })
    // If this were a Promise, `.email` wouldn't exist on it directly.
    expect(typeof result).toBe('object')
    expect(result).not.toBeInstanceOf(Promise)
  })
})
