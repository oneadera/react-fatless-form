// Registers jest-dom's matchers (toHaveFocus, toBeDisabled, etc.) onto
// `expect` for every test file. `@testing-library/react`'s own automatic
// `cleanup()` after each test is left at its default (enabled) - no manual
// afterEach needed here.
import '@testing-library/jest-dom'

// @testing-library/react is supposed to set this automatically on import,
// but async flows driven by act(async () => {...}) + waitFor(...) (see
// __tests__/handleSubmit.test.tsx) have shown it isn't reliably set by the
// time they run - React then falls back to its production scheduler instead
// of synchronously flushing inside act(), and updates can fail to commit at
// all in jsdom rather than just warning. Setting it explicitly here (the fix
// React's own docs recommend for exactly this class of issue) makes it
// unconditional rather than depending on import-order/timing.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
