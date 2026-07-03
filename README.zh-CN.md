# Vue Vben Admin（Element Plus 精简版）

这个仓库已经精简为只保留基于 `Element Plus` 的 `web-ele` 应用。

## 当前保留内容

- `apps/web-ele`：主前端应用
- `apps/backend-mock`：开发期使用的 mock 后端服务
- `packages/*`：共享平台能力包
- `internal/*`：构建、Lint、TSConfig 等内部工程基础设施
- `scripts/*`：工作区脚本

## 环境要求

- Node.js `22.18+` 或 `24+`
- `pnpm` `11+`
- Git

## 安装

```bash
git clone https://github.com/vbenjs/vue-vben-admin.git
cd vue-vben-admin/code
npm i -g corepack
pnpm install
```

## 启动

```bash
pnpm dev:ele
```

## 构建

```bash
pnpm build:ele
```

## 常用命令

```bash
pnpm dev:ele
pnpm build:ele
pnpm lint
pnpm test:unit
pnpm check
```

## 目录结构

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

## 说明

- 之前的多 UI 版本应用已经全部移除。
- 仓库内的文档站和 playground 示例应用也已经一并移除。
- Docker 部署构建现在默认产出 `apps/web-ele/dist`。

## 许可证

[MIT](./LICENSE)
