// Registers jest-dom's matchers (toHaveFocus, toBeDisabled, etc.) onto
// `expect` for every test file. `@testing-library/react`'s own automatic
// `cleanup()` after each test is left at its default (enabled) - no manual
// afterEach needed here.
import '@testing-library/jest-dom'
