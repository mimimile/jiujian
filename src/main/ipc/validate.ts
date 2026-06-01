import type { IpcMainInvokeEvent } from 'electron'

/**
 * 基础发送方校验：拒绝无 senderFrame 或来源异常的调用。
 * 仅放行 dev server(localhost) / 本地文件 / 自定义协议。生产可进一步钉死 origin。
 */
export function isValidSender(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame
  if (!frame) return false
  const url = frame.url
  return (
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('file://') ||
    url.startsWith('app://')
  )
}
