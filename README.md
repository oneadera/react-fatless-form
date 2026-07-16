# react-fatless-form 🥬

![License](https://img.shields.io/github/license/aderahenry/react-fatless-form) ![core](https://img.shields.io/npm/v/react-fatless-form?label=core) ![web](https://img.shields.io/npm/v/react-fatless-form-web?label=web) ![native](https://img.shields.io/npm/v/react-fatless-form-native?label=native)

_A headless form library for React and React Native. Lean, typed up the yin-yang, and built to stay out of your way._

```text
packages/
  core/    react-fatless-form         - headless form state, zero DOM/RN knowledge (v5)
  web/     react-fatless-form-web     - DOM bindings (<input>, <select>, <form>)
  native/  react-fatless-form-native  - React Native bindings (TextInput, Switch)
examples/
  web/     example-web                - signup form using react-fatless-form-web + MUI
  native/  example-native             - signup form using react-fatless-form-native + React Native Paper
```

Start with whichever package README matches what you're building:
[core](packages/core/README.md) · [web](packages/web/README.md) · [native](packages/native/README.md)

---

## Why fatless?

The name has always meant "no baggage." No bloated abstractions, no laundry list of dependencies, no over-engineered features you'll never use. It's form state management that's been on a diet - still powerful, but won't weigh your project down.

Earlier versions took this pretty far on the _outside_ while carrying real weight on the _inside_: a built-in `Input` component that rendered its own datepicker, time picker, drag-and-drop file picker, and password-strength meter, plus a `FeedbackManager` toast system wired straight into `handleSubmit`.

v5 takes "fatless" more literally. `react-fatless-form` has exactly one dependency (`react`). It doesn't render a single pixel, doesn't ship a datepicker, and doesn't know what a toast notification is. It manages state, validation, and types - your design system handles the rest.

---

## Coming from v4?

v5 is a ground-up rewrite. The key API names (`useForm`, `useFormContext`, `FormProvider`, `handleSubmit`, `yupResolver`) all survive - your mental model carries over.

**What changed:**

- The all-in-one `Input` component is gone (and with it the built-in datepicker, time picker, file dropzone, password-strength meter). v5 is fully headless - bring your own UI library.
- `FeedbackManager`/`FeedbackContainer` are gone. Show feedback in your own `onSuccess`/`onError` callbacks.
- `validateSchema` is gone (it was deprecated in v4).
- `handleSubmit`'s positional `onSuccess` and `feedbackConfig` arguments are now a single `config` object: `{ onSuccess, onError, resetOnSuccess }`.
- Field paths now support deeply nested dot-notation (`'address.street'`) with full TypeScript inference - not just top-level keys.
- New typed path filters (`StringFieldPath`, `BooleanFieldPath`, `NumberFieldPath`, `StringArrayFieldPath`) so typed input components can't be wired to the wrong field type at compile time.
- `form.setFocus('fieldName')` for imperative, typed focus control.
- React Native support via the new `react-fatless-form-native` package.

If you relied on the batteries-included `Input` experience, pin to v4 for now. A separate opinionated component package built _on top of_ `react-fatless-form-web` would be the right home for that - not the headless core.

---

## Installing only what you need

A web app installs `react-fatless-form-web` and never sees `react-native` anywhere in its dependency tree - not even as an unmet peer warning. A native app installs `react-fatless-form-native` and never pulls in any DOM types. `react-fatless-form` comes along automatically as a transitive dependency of either.

```sh
# For web apps
npm install react-fatless-form-web

# For React Native / Expo apps
npm install react-fatless-form-native

# Core only (for custom platform bindings)
npm install react-fatless-form
```

**Why three packages, not one package with `/web` and `/native` subpath exports?**
`peerDependencies` are declared once per `package.json`, with no way to scope them to a single subpath. A single-package version would have to declare `react-native` as a peer of the entire package to support a `/native` export - and a web-only install would then see a peer warning it can never satisfy. Separate packages mean peer dependencies are exactly as scoped as the packages themselves.

---

## Why split this way

`react-fatless-form` (core) owns values, validation, errors, and touched state, and knows nothing about `HTMLInputElement` or React Native's `TextInput`. `web` and `native` each add a thin layer that unwraps their platform's event shape (`event.target.value` vs. a plain string from `onChangeText`) into what core expects. Neither platform package imports the other, and core never imports either.

The payoff: validation logic, the field-path type system, and the submission lifecycle are written and tested exactly once. A new platform binding only has to write the event-unwrapping layer.

---

### A note on the first run

The `.yarn/cache` is committed (offline-friendly installs) but the first `yarn install` after cloning is still required to materialize `node_modules` from that cache. After that, subsequent installs only need to run when adding or updating packages.

The web example resolves `react-fatless-form` and `react-fatless-form-web` straight to their TypeScript source via `vite.config.ts` aliases, so `yarn workspace example-web dev` works without building first and edits to library source hot-reload immediately. The native example runs `build:deps` as a pre-hook, building core and native before Expo starts.

---

## Testing

Each package owns its own Jest config (`jest.config.cjs`), Babel config (`babel.config.cjs`), and `__tests__/` directory - mirroring how `build`/`typecheck`/`lint` are already per-package scripts orchestrated from the root via `yarn workspaces foreach`, rather than one shared root config.

```bash
yarn test              # every package's suite, via workspaces foreach
yarn test:coverage     # same, with coverage

yarn workspace react-fatless-form test              # just core
yarn workspace react-fatless-form-web test:watch     # just web, watch mode
```

A few decisions worth knowing about if you're adding tests:

- **Babel, not `ts-jest`.** Tests are transpiled with `babel-jest` (`@babel/preset-env` + `@babel/preset-typescript` + `@babel/preset-react`), the same as most RTL setups. This sidesteps any friction between Jest's CJS-based module system and these packages' `"type": "module"` — Babel converts test files to CommonJS before Jest's module loader ever sees an `import`/`export`. Type-checking tests is a separate, optional concern (see `tsconfig.test.json` below), not something Jest does.
- **`web` and `native` tests resolve `react-fatless-form` to core's source, not `dist/`.** Each package's `jest.config.cjs` maps it via `moduleNameMapper`, mirroring the `paths` alias in that package's `tsconfig.test.json`. This means `yarn test` never depends on `yarn build` having run first - and note this is now independent of the main `tsconfig.json`, which resolves `react-fatless-form` through regular `node_modules`/`dist` resolution instead (so `yarn typecheck` here does expect `core` to have been built).
- **`__tests__/` lives outside `src/`.** Nothing under `include: ["src"]` changes, so the existing `build`/`typecheck` scripts are untouched by adding tests. `tsconfig.test.json` (per package, not used by any script) exists purely so editors get full IntelliSense — including the `react-fatless-form` path alias — inside `__tests__/` too.
- **`native`'s tests never load real `react-native`.** Its `src/` only ever touches one export from it (`Keyboard.dismiss`, in `useFormSubmit.ts`) — none of its hooks render actual RN components — so tests use a `virtual: true` Jest mock for `react-native` instead of the real package and its RN-specific Babel/Metro preset. Everything else runs through `@testing-library/react`'s `renderHook`, the same as `web` and `core`.
- **Every package's `react`/`react-dom` devDependency - root, `core`, `web`, and `native` alike - is pinned to the exact same version (`18.2.0`), not a caret range anywhere.** This one is worth understanding fully if you ever touch it, because a partial version of this fix looks like it works (no warnings) while still being broken (tests crash with "Invalid hook call").
  - `react-native` peer-requires an _exact_ React version to match its bundled reconciler, not a range - currently `18.2.0` for the `0.74.x` line this project uses. `native` depends on `core` as a real `workspace:*` dependency (not just for typechecking), and Yarn treats a workspace's full dependency set - `devDependencies` included - as part of what it provides to dependents. So `core`'s own `react-dom` version rides along into `native`'s (and `examples/native`'s) peer graph too, and since `react-dom` always peer-requires a caret range matching its own version, any newer `react-dom` in `core` collides with `react-native`'s exact pin.
  - Pinning only `core` and `native` (leaving `web` and root on a newer caret range) clears Yarn's peer-validation warnings, but doesn't fully fix it: Yarn's hoisting is a whole-tree decision, not a pairwise one. As long as _anything_ in the tree still prefers a different version, Yarn has a reason to nest separate, non-hoisted copies of `react` for the packages that can't share the root's preferred version - and which nested copy each package actually lands on isn't guaranteed to be the same physical file, even when their `package.json` entries happen to say the identical version string. Two different physical copies of `react` (as opposed to two different _versions_) means React DOM sets its internal dispatcher on one copy while a hook call resolves `react` from the other - `TypeError: Cannot read properties of null (reading 'useState')`. This surfaced specifically when `web`'s and `native`'s tests imported `core`'s hooks via source (see the `moduleNameMapper` note below): `core`'s nested `react` diverged from whichever `react`/`react-dom` `@testing-library/react` resolved to in that package's own tree. The fix is to remove every disagreement, not just the loudest one - once nothing anywhere in the tree prefers a version other than `18.2.0`, there's no remaining reason for Yarn to fragment the install, and hoisting a single shared copy to the root becomes the only sensible outcome. The root `resolutions` field adds a second, more explicit layer on top of that (`"react-fatless-form/react": "18.2.0"` and the same for the other two packages and `react-dom`), scoped to just these three packages so it doesn't affect `examples/web`'s independent dependencies. Bump all of this only in lockstep with whatever exact React version the `react-native` range in the `native` package resolves to - and after bumping, prefer a full `rm -rf node_modules && yarn install` over an incremental install, since incrementally patching version constraints that used to conflict is exactly the scenario that can leave stale, inconsistent copies behind.
- **Every field hook is tested at two layers:** the pure `adaptXField` function in isolation (a hand-built `FieldBinding`, no `FormProvider` involved) for precise edge-case coverage, plus `useXField` through a real `useForm()` + `FormProvider` (via each package's `__tests__/test-utils.tsx`) for integration coverage — and for `web`, at least one full DOM round trip per hook (`render` + `fireEvent`/`userEvent` against a real `<input>`/`<select>`).
Two behaviors the tests turned up that are worth a look, independent of anything test-related:
- `useNumberField`'s (both `web` and `native`) displayed `value` only special-cases `undefined`, not `null` — `field.value === undefined ? '' : String(field.value)`. Since both adapters' own `onChange`/`onChangeText` commit `null` for a cleared input, clearing the field and re-rendering displays the literal text `"null"` rather than blank.
- Both `useNumberField` adapters' doc comments list a trailing decimal point (e.g. `'1.'`) alongside a lone `'-'` as "not-yet-parseable" input that gets ignored. In practice `Number('1.')` (native) and `valueAsNumber` for `'1.'` (web, per the HTML spec's own float-parsing algorithm) both evaluate to `1`, so that specific input actually commits rather than being ignored.

---

## Examples

Both examples are the same signup form - first/last name, email, password, agree-to-terms - so the web and native API surfaces are easy to compare side by side:

- **[web](examples/web)** - [MUI](https://mui.com)
- **[native](examples/native)** - [React Native Paper](https://callstack.github.io/react-native-paper/) via Expo

---

## License

MIT
