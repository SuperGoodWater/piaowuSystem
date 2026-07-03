# Vue Vben Admin (Element Plus Edition)

This repository has been streamlined to keep only the `web-ele` application based on `Element Plus`.

## What Remains

- `apps/web-ele`: the main frontend application
- `apps/backend-mock`: mock backend service used during development
- `packages/*`: shared platform packages
- `internal/*`: shared build, lint, tsconfig, and tooling infrastructure
- `scripts/*`: workspace scripts

## Requirements

- Node.js `22.18+` or `24+`
- `pnpm` `11+`
- Git

## Install

```bash
git clone https://github.com/vbenjs/vue-vben-admin.git
cd vue-vben-admin/code
npm i -g corepack
pnpm install
```

## Run

```bash
pnpm dev:ele
```

## Build

```bash
pnpm build:ele
```

## Useful Scripts

```bash
pnpm dev:ele
pnpm build:ele
pnpm lint
pnpm test:unit
pnpm check
```

## Project Structure

```text
code
├─ apps
│  ├─ backend-mock
│  └─ web-ele
├─ internal
├─ packages
├─ scripts
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Notes

- The previous multi-UI application variants have been removed.
- The in-repo docs site and playground app have also been removed as part of the cleanup.
- Deployment Docker build now targets `apps/web-ele/dist`.

## License

[MIT](./LICENSE)
