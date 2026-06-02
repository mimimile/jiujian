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

- **🎯 成本重构：数据预注入**（降本 ~91%，$1.5→$0.128/次）。main 本地用 stock-sdk + addIndicators 算好 MA/MACD/BOLL/KDJ/RSI + 资金流，拼紧凑数据块注入 prompt，claude 无 MCP、1 turn 直接分析。`analysis-context.ts` + orchestrator 默认注入/预取失败退回 MCP + provider MCP 可选。
- 成本优化前置：按市场窄化 MCP allowedTools（退回路径用，简单查询降 43%）。
- **M2 增量（单股深度分析）**：实时行情头（stock-sdk 直拉 quote，A/HK/US/FUND，红涨绿跌）；KLineChart 加指标（MA 叠加主图 + VOL/MACD 副图）；分析报告 markdown 渲染（react-markdown + 暗色样式，替换纯文本）。
- git 初始化 + 提交 M1 骨架（gitignore 含 token 的 `.mcp.json` 与 `.specstory/` 对话日志）。
- **M3 增量**：自选股 watchlist（localStorage 持久化，侧栏列表/增删/点选加载，工具栏「☆ 自选」切换）。
- 修：FUND 涨跌幅不再伪造（SDK `change` 语义存疑）→ 置 null，只展示净值 + 原始 change。

- **M5 打包**：electron-builder 配置（appId `cn.jiujian.app`、mac dmg+zip arm64、Win NSIS、Linux AppImage），脚本 `pack:dir`/`dist:mac`/`dist:win`。本地无签名 `.app`（261M）已构建并验证真启动。中文 productName rename 问题用 `executableName: jiujian` 解决（显示名仍「韭见」）。

- **UI/交互整体复盘重构（量化终端美学）**：暗墨底 + 琥珀金强调 + 红涨绿跌(仅数据) + IBM Plex Mono 等宽 + 系统 CJK。终端命令栏 + 醒目行情条 + 自选侧栏(迷你实时行情) + 暗色K线(金色十字线) + AI 报告(金色 markdown) + 常驻免责 footer + 交错入场/shimmer 加载/终端空态。新增 `@fontsource/ibm-plex-mono`、`dev-mock.ts`(浏览器预览)。
- 常驻投资免责声明条。app 图标（金「韭」+ 烛台，`build/icon.png`）。已用 chrome-devtools 截图核对渲染。

- **M4 盘后复盘/每日摘要**：masthead「复盘」按钮 → main 拼全自选股紧凑快照(价/涨跌/MA多空/MACD/RSI/KDJ)+大盘(sh000001) → 一次 claude 出整体复盘(情绪/分化/值得关注/风险)，流入 AI 面板。新增 CLAUDE_RECAP IPC + orchestrator.runRecap(复用 _execute) + buildRecapContext + useClaudeStream.recap。
- 真机 e2e 验证（含复盘模式）：单股分析 + 复盘均端到端跑通真 claude，复盘 3股+大盘 ~$0.11。e2e 钩子(JJ_E2E)支持 analyze/recap 双模式。

- **定时收盘自动复盘 + 通知**：`useAutoRecap`（app 内调度，工作日到设定时间自动触发复盘 + 系统 Notification[开始/完成]，localStorage 持久化设置并防当日重复）。`SettingsPopover`（⚙ 齿轮：开关 + 时间）。注：依赖 app 保持开启。

- **复盘/分析历史留存**：`useHistory`（localStorage 最近 50 条，单股分析 + 复盘自动入史，含标题/时间/正文/成本）+ `HistoryDrawer`（masthead「🕘 历史」→ 右侧抽屉：列表 + 查看 markdown + 删除/清空）。auto-recap 也经包装的 `doRecap` 入史。

### 记录（重要事实）
- ⚠️ **2026-06-15 起** `claude -p` / Agent SDK 用量不再计入交互订阅上限，改从独立月度 Agent SDK 额度（Pro $20/Max5x $100/Max20x $200）按 API 价扣费、不滚存。原"蹭免费冗余算力"卖点失效，已重述为"变现订阅自带的月度额度"（见决策 D2/D9）。
- ⚠️ ToS：官方明禁第三方通过用户 Pro/Max 凭据路由请求（商业/公开场景的红线）；个人非商业自用属"ordinary individual usage"，不触发。

---

> 约定：每完成一个里程碑或重要变更，在 `[未发布]` 下按 `新增/变更/修复/移除` 分类追加；正式发版时把 `[未发布]` 改为 `[x.y.z] - YYYY-MM-DD`。
