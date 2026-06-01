// IPC 通道名单一事实源。main 与 preload 都从这里引用，杜绝字符串漂移。

export const IPC = {
  /** renderer -> main (invoke)：探测 claude 环境 */
  SYSTEM_DETECT: 'system:detect',
  /** renderer -> main (invoke)：发起一次分析，返回 { runId } */
  CLAUDE_RUN: 'claude:run',
  /** renderer -> main (invoke)：取消某次运行 */
  CLAUDE_CANCEL: 'claude:cancel',
  /** main -> renderer (send)：流式分析事件 */
  CLAUDE_EVENT: 'claude:event',
  /** renderer -> main (invoke)：图表用 K线（main 直接走 stock-sdk 拉取） */
  STOCK_KLINE: 'stock:kline'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
