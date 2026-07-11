/**
 * `src/utils.ts` isn't part of this package's public API (nothing in
 * `src/index.ts` re-exports `get`/`set`/`normalizePath`), but it's the
 * foundation every public API sits on - `useForm`'s `setFieldValue`,
 * `useField`'s value reads, and `yupResolver`'s path normalization all go
 * through it. It's tested directly, by importing the module itself, for
 * precise coverage of edge cases that would be tedious (and less clear on
 * failure) to exercise only indirectly through `useForm`.
 */
import { get, normalizePath, set } from '../src/utils'

describe('normalizePath', () => {
  it('converts a single bracket index to dot notation', () => {
    expect(normalizePath('items[0].name')).toBe('items.0.name')
  })

  it('converts multiple bracket indices, including adjacent ones', () => {
    expect(normalizePath('a[0][1].b')).toBe('a.0.1.b')
  })

  it('leaves already-dotted paths unchanged', () => {
    expect(normalizePath('a.b.c')).toBe('a.b.c')
  })

  it('leaves a plain top-level key unchanged', () => {
    expect(normalizePath('email')).toBe('email')
  })

  it('handles multi-digit indices', () => {
    expect(normalizePath('items[12].name')).toBe('items.12.name')
  })

  it('returns an empty string unchanged', () => {
    expect(normalizePath('')).toBe('')
  })
})

describe('get', () => {
  it('reads a top-level value', () => {
    expect(get({ email: 'a@b.com' }, 'email')).toBe('a@b.com')
  })

  it('reads a nested value via a dot path', () => {
    expect(get({ address: { street: 'Main St' } }, 'address.street')).toBe('Main St')
  })

  it('reads a deeply nested value', () => {
    const obj = { a: { b: { c: { d: 'deep' } } } }
    expect(get(obj, 'a.b.c.d')).toBe('deep')
  })

  it('reads an array element by numeric path segment', () => {
    expect(get({ tags: ['a', 'b', 'c'] }, 'tags.1')).toBe('b')
  })

  it('reads a property nested inside an array element', () => {
    const obj = { items: [{ name: 'first' }, { name: 'second' }] }
    expect(get(obj, 'items.1.name')).toBe('second')
  })

  it('returns undefined for a missing top-level key', () => {
    expect(get({ email: 'a@b.com' }, 'missing' as never)).toBeUndefined()
  })

  it('returns undefined for a missing nested key', () => {
    expect(get({ address: { street: 'Main St' } }, 'address.city' as never)).toBeUndefined()
  })

  it('returns undefined when an intermediate segment is missing entirely', () => {
    expect(get({}, 'a.b.c' as never)).toBeUndefined()
  })

  it('returns undefined when walking a path past a primitive leaf', () => {
    expect(get({ a: 1 }, 'a.b.c' as never)).toBeUndefined()
  })

  it('returns undefined for an out-of-range array index', () => {
    expect(get({ tags: ['a', 'b'] }, 'tags.5' as never)).toBeUndefined()
  })

  it('returns undefined for an empty path', () => {
    expect(get({ a: 1 }, '')).toBeUndefined()
  })

  it('does not throw when obj itself is null or undefined', () => {
    expect(get(null, 'a.b')).toBeUndefined()
    expect(get(undefined, 'a.b')).toBeUndefined()
  })

  it('supports a default value via the untyped overload', () => {
    expect(get({} as Record<string, unknown>, 'missing', 'fallback')).toBe('fallback')
  })

  it('treats a Date value as a leaf rather than recursing into it', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    expect(get({ dob: date }, 'dob')).toBe(date)
  })
})

describe('set', () => {
  it('sets a top-level primitive value', () => {
    expect(set({ count: 1 }, 'count', 2)).toEqual({ count: 2 })
  })

  it('creates intermediate objects that do not yet exist', () => {
    expect(set({}, 'address.street', '123 Main St')).toEqual({
      address: { street: '123 Main St' },
    })
  })

  it('creates an intermediate array when the next path segment is numeric', () => {
    expect(set({}, 'tags.0', 'first')).toEqual({ tags: ['first'] })
  })

  it('creates an array of objects for a deep numeric-then-key path', () => {
    expect(set({}, 'items.0.name', 'Alice')).toEqual({ items: [{ name: 'Alice' }] })
  })

  it('normalizes bracket-notation paths before setting', () => {
    expect(set({}, 'items[0].name', 'Bob')).toEqual({ items: [{ name: 'Bob' }] })
  })

  it('overwrites an existing nested value while preserving sibling keys', () => {
    expect(set({ a: { x: 1, y: 2 } }, 'a.x', 99)).toEqual({ a: { x: 99, y: 2 } })
  })

  it('overwrites one array element while preserving the others', () => {
    expect(set({ tags: ['a', 'b', 'c'] }, 'tags.1', 'B')).toEqual({ tags: ['a', 'B', 'c'] })
  })

  it('replaces a whole array field in one call', () => {
    expect(set({ tags: ['a', 'b'] }, 'tags', ['x', 'y', 'z'])).toEqual({ tags: ['x', 'y', 'z'] })
  })

  it('does not mutate the original top-level object', () => {
    const original = { a: 1, b: 2 }
    const result = set(original, 'a', 99)
    expect(original.a).toBe(1)
    expect(result).not.toBe(original)
  })

  it('does not mutate the original nested object, and clones only the touched branch', () => {
    const original = { a: { b: 1 }, untouched: { c: 2 } }
    const result = set(original, 'a.b', 99)

    expect(original.a.b).toBe(1)
    expect(result.a.b).toBe(99)
    expect(result.a).not.toBe(original.a)
    // Sibling branch never touched by the path - same reference, proving
    // the clone is shallow-per-segment, not a deep clone of the whole tree.
    expect(result.untouched).toBe(original.untouched)
  })

  it('does not mutate an original array item, and clones only the touched item', () => {
    const original = { list: [{ v: 1 }, { v: 2 }] }
    const result = set(original, 'list.0.v', 100)

    expect(original.list[0].v).toBe(1)
    expect(result.list[0].v).toBe(100)
    expect(result.list).not.toBe(original.list)
    expect(result.list[0]).not.toBe(original.list[0])
    // Untouched sibling array item is the same reference.
    expect(result.list[1]).toBe(original.list[1])
  })

  it('replaces a non-object value at an intermediate segment with an object', () => {
    // `a` starts out as a primitive; setting a path through it should
    // coerce it into an object rather than throwing.
    expect(set({ a: 'oops' }, 'a.b', 1)).toEqual({ a: { b: 1 } })
  })

  it('operates on an array root', () => {
    expect(set([1, 2, 3], '1', 99)).toEqual([1, 99, 3])
  })

  it('returns the same object reference, unchanged, for an empty path', () => {
    const original = { a: 1 }
    const result = set(original, '', 5)
    expect(result).toBe(original)
  })

  it('accepts null as a value (used to clear a field)', () => {
    expect(set({ age: 30 }, 'age', null)).toEqual({ age: null })
  })

  it('handles a three-level-deep array-of-array-of-objects path', () => {
    expect(set({}, 'groups.0.members.0.name', 'Carol')).toEqual({
      groups: [{ members: [{ name: 'Carol' }] }],
    })
  })
})
