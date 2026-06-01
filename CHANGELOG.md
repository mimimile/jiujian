# 变更记录

本文件记录韭见项目的所有重要变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- 项目立项，定名 **韭见 JiuJian**（slug `jiujian`）。
- 确定 **BYO 订阅** 分发模式（用户自带 Claude Code 订阅，应用不付 API 费）。
- 确定技术栈：pnpm + 全栈 TypeScript + Electron。
- 确定数据源 `stock-sdk`，覆盖 A股/港股/美股/基金ETF。
- 确定 AI 接入方式：无头 `claude -p` + stock-sdk MCP。
- 初始化文档体系：README、CHANGELOG、决策记录、路线图、进度、地基调研。
- 完成地基调研（编排 `w06rfvlku`）：技术闭环本机验证可跑。
- 拍板技术栈：electron-vite + React18/TS + shadcn/ui + KLineChart + electron-builder。
- 明确定位：**个人非商业**，目标是更丰富地使用作者自己的 Claude Code 订阅 → 承重假设裁决 🟢 GREEN。

- **M1 骨架最小闭环**：手搓 electron-vite + React18/TS 工程；main/preload/renderer 三层 + shared(IPC 契约/Zod/类型) 单一事实源；安全窗口（contextIsolation/sandbox/CSP）；claude 二进制探测 + 可插拔鉴权（仅 SubscriptionCliProvider）；claude 编排器（spawn `claude -p` stream-json 流式 + MCP 挂载 + 取消/错误码）；KLineChart 面板（main 用 stock-sdk 直拉日K）；状态横幅 + 流式分析面板 + 成本遥测。
- 加 `stock-sdk@1.10.0` 直接依赖（图表直拉）。
- 验证：typecheck + electron-vite build 全绿；stock-sdk 实拉 5929 根日K；claude 探测实测解析到 claude.sh（处理 alias/PATH/.zshrc 横幅噪音）。

- **M2 增量（单股深度分析）**：实时行情头（stock-sdk 直拉 quote，A/HK/US/FUND，红涨绿跌）；KLineChart 加指标（MA 叠加主图 + VOL/MACD 副图）。
- git 初始化 + 提交 M1 骨架（gitignore 含 token 的 `.mcp.json` 与 `.specstory/` 对话日志）。

### 记录（重要事实）
- ⚠️ **2026-06-15 起** `claude -p` / Agent SDK 用量不再计入交互订阅上限，改从独立月度 Agent SDK 额度（Pro $20/Max5x $100/Max20x $200）按 API 价扣费、不滚存。原"蹭免费冗余算力"卖点失效，已重述为"变现订阅自带的月度额度"（见决策 D2/D9）。
- ⚠️ ToS：官方明禁第三方通过用户 Pro/Max 凭据路由请求（商业/公开场景的红线）；个人非商业自用属"ordinary individual usage"，不触发。

---

> 约定：每完成一个里程碑或重要变更，在 `[未发布]` 下按 `新增/变更/修复/移除` 分类追加；正式发版时把 `[未发布]` 改为 `[x.y.z] - YYYY-MM-DD`。
