# McFit

## 简介

这个项目叫做McFit，我写这个的初衷纯属是为了整活，我意外看到麦当劳竟然有MCP了，所以就做了这个项目，其实这个项目只是为了大家开心，我希望大家在使用的过程中吃的开心运动得开心，早点睡觉，祝大家开开心心！

## 技术栈

- **Monorepo**：pnpm + [Turborepo](https://turbo.build)
- **前端应用**（`apps/mcfit`）：React 19、Vite 6、TypeScript、Tailwind CSS v4、React Router
- **UI/动效**：Lucide React、Motion
- **PWA**：Vite 插件 [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **包**（`packages/api`）：TypeScript 构建；对外依赖含 OpenAI、MCP SDK

## 目录结构

```
McFit/
├── apps/
│   └── mcfit/        # 主 Web 应用
├── packages/
│   └── api/          # @mcfit/api 共享包
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 环境要求

- Node.js **>= 20**
- 包管理器 **pnpm@9.15.4**（见根目录 `packageManager` 字段，建议使用 Corepack 对齐版本）

## 开发

在仓库根目录安装依赖后：

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 以 Turborepo 启动各包 `dev`（`mcfit` 会先构建 `api` 再跑 Vite） |
| `pnpm build` | 全量构建 |
| `pnpm lint` | 全量执行各包 `lint`（当前子项目多为占位） |
| `pnpm preview` | 对 `mcfit` 执行构建后的本地预览（`turbo run preview --filter=mcfit`） |

仅开发前端时也可进入 `apps/mcfit` 按该包内 `package.json` 的 `dev` 脚本使用。

## 子项目

- **`apps/mcfit`**：Vite 前端入口、静态资源、PWA 相关配置等。
- **`packages/api`**：构建为 `dist/`，主入口 `index.js` / 类型 `index.d.ts`；`mcfit` 通过 `workspace:*` 依赖此包。
