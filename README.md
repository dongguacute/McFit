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

## 免责声明

- **非官方、非商业**：本仓库为个人学习与娱乐向作品，与麦当劳（McDonald’s）及任何其关联公司、产品、MCP/接口提供方**无授权、无隶属、无代言关系**；所涉商标、商号、界面元素仅作说明或整活，权利归各权利人所有。
- **非专业建议**：本应用及其中展示的信息（含 AI 生成内容、营养/运动相关表述、推荐或估算）**不构成医疗、营养、健身、饮食或安全方面的专业建议**；请勿替代医师、营养师等合格专业人士的意见。因饮食、运动、作息或依赖本应用信息而产生的后果，由使用者自行判断与承担。
- **内容与时效**：地图、餐厅信息、产品成分、价格、活动及第三方服务（含大模型、地图、MCP 等）可能变更、错误或不完整；作者**不保证**任何内容的准确性、完整性、实时性或适用性。
- **「按现状」提供**：在适用法律允许的范围内，本仓库**按「现状」**提供，**不作任何明示或默示的担保**；对因使用、无法使用本软件而引发的任何**直接、间接、附带或后果性**损失，作者不承担责任，除非法律强制要求。
- 使用本应用即表示您已阅读并理解上述条款。若需正式用途、合规或医疗决策，请自行核实信息并咨询对应专业人士。
