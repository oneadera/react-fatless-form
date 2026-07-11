# example-web

A signup form (first/last name, email, password, agree-to-terms) built with
[react-fatless-form-web](../../packages/web) and [MUI](https://mui.com).

Demonstrates:
- `ControlledTextField` and `ControlledCheckbox` wrapping MUI components - the same pattern for any design system
- `useTextField`, `useCheckboxField`, `useFormSubmit` from `react-fatless-form-web`
- `yupResolver` for validation, inline success/error feedback via `form.submissionStatus`
- Wiring `ref` through MUI's current `slotProps.htmlInput.ref` / `slotProps.input.ref` for `form.setFocus(...)` support

## Run it

```sh
yarn workspace example-web dev
```

No build step needed first - `vite.config.ts` resolves `react-fatless-form-web` and `react-fatless-form` straight to their TypeScript source, so edits to library code hot-reload here immediately.
