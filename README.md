<div align="center">

# 韭见 JiuJian

**让韭菜有洞见** —— 复用你自己的 Claude Code 订阅做 AI 股票分析的桌面应用

<sub>An Electron desktop app that turns your own Claude Code subscription into an AI stock analyst.</sub>

[English README](README.en.md) · [License](LICENSE)

![license](https://img.shields.io/badge/license-MIT-e7b53c) ![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-24262d) ![electron](https://img.shields.io/badge/Electron-35-24262d) ![cost](https://img.shields.io/badge/单次分析-~%240.1-16b877)

![韭见 截图](screenshots/hero.png)

</div>

## 这是什么

**韭见** 把 [`stock-sdk`](https://github.com/chengzuopeng/stock-sdk) 的实时行情，交给你**本机已登录的 Claude Code 订阅**做 AI 分析 —— 应用本身**不内置任何 API key、不向任何服务器路由请求**，跑的是你已经付费的订阅里那部分额度。

> **BYO 订阅（自带订阅）**：每个用户用自己的 Claude Code，韭见只负责数据 + 界面 + 编排。把你早已付费、却大量闲置的订阅额度，变成股票分析能力。

## ✨ 功能

- **单股深度分析** —— 输入代码，AI 给出趋势研判 / 支撑压力位 / 量价资金 / 风险提示，流式 markdown 报告（单次约 **$0.13**）
- **盘后复盘** —— 一键对全部自选股 + 大盘出一份整体复盘（单次约 **$0.11**）
- **定时自动复盘** —— 收盘后到点自动复盘 + 系统通知
- **后台常驻** —— 关窗缩到菜单栏、开机自启，复盘无需手动开应用
- **自选股** —— 本地自选列表 + 每行实时迷你行情
- **K线图表** —— 日K + MA / VOL / MACD 指标（红涨绿跌）
- **历史留存** —— 分析与复盘自动留存，随时回看
- 覆盖 **A股 / 港股 / 美股 / 基金ETF**

## 🧠 工作原理（为什么便宜）

韭见的核心是一条**省钱的数据管线**：

```
渲染层 → IPC → 主进程
  主进程用 stock-sdk 本地拉 K线 + 算好 MA/MACD/BOLL/KDJ/RSI + 资金流
  → 拼成紧凑数据块注入 prompt
  → spawn 你的 claude（无头、无 MCP）直接分析
  → 流式 stream-json 回渲染层渲染
```

让 Claude 自己经 MCP 拉全历史 K线，单次要 **~$1.5**；改成"应用喂摘要、Claude 只动脑"后，单次 **$0.13**（降 ~91%），还更快更准。详见 [`docs/研究/地基调研.md`](docs/研究/地基调研.md)。

## 🚀 快速开始

**前置要求**

- [Node.js](https://nodejs.org) ≥ 18、[pnpm](https://pnpm.io)
- 本机安装并登录 [Claude Code](https://code.claude.com/docs)（Pro / Max 订阅）：`claude auth login`

**开发运行**

```bash
pnpm install
pnpm dev
```

**打包（macOS）**

```bash
pnpm dist:mac     # 产出 release/韭见-x.y.z-arm64.dmg（无签名，首次右键→打开）
```

首次启动若未检测到 Claude Code，应用内会有引导。

## 💰 成本说明（请务必了解）

韭见不收任何费用，但 **AI 分析会消耗你 Claude 订阅的额度**：

- 自 **2026-06-15** 起，`claude -p` / Agent SDK 用量从订阅自带的**月度 Agent SDK 额度**扣费（Pro $20 / Max 5x $100 / Max 20x $200），按 API 标价计费、不滚存。详见 [Anthropic 官方说明](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)。
- 韭见已做大量优化：单股分析约 **$0.13**、盘后复盘约 **$0.11**。应用内有成本遥测，每次都显示花了多少。
- 以 Max 20x（$200/月）估算 ≈ 每月 ~1500 次分析。

## ⚠️ 重要声明

- **BYO 订阅**：韭见复用你**本机自己的** Claude Code，不内置 key、不路由请求、不代理任何人的凭据。请遵守 [Anthropic 服务条款与使用政策](https://www.anthropic.com/legal/consumer-terms)。
- 本项目**与 Anthropic 无任何关联**，非官方产品。
- 数据源为公开行情端点，**可能有数十秒到分钟级延迟**。
- 本应用输出为**数据分析，非投资建议**，据此操作风险自负。

## 🗺️ 路线图

见 [`docs/路线图.md`](docs/路线图.md)。已完成 MVP v0.1（单股深析 / 盘后复盘 / 定时自动复盘 / 后台常驻 / 历史）。

## 🛠️ 技术栈

electron-vite · React 18 · TypeScript · Tailwind v4 · [KLineChart](https://github.com/klinecharts/KLineChart) · [stock-sdk](https://github.com/chengzuopeng/stock-sdk) · electron-builder

设计语言「量化终端」：近黑暖墨底 + 琥珀金强调 + 红涨绿跌 + IBM Plex Mono 等宽。

## 🤝 贡献

欢迎 issue / PR。本仓库本身用 [Claude Code](https://code.claude.com) 开发。开发约定见 [`docs/决策记录.md`](docs/决策记录.md)。

## 📄 License

[MIT](LICENSE) © 2026 韭见 JiuJian
