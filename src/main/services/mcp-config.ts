import { app } from 'electron'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/** MCP server 名（决定 claude 里工具的命名空间 mcp__stock-sdk__*） */
export const MCP_SERVER_NAME = 'stock-sdk'

/** pin 的 MCP 包版本 */
const STOCK_MCP_PKG = 'stock-sdk-mcp@0.2.1'

/**
 * 写出 stock-sdk-mcp 的 --mcp-config 文件，返回路径。
 *
 * 注（打包硬化项，见 docs/研究/地基调研.md 开放决策 #5）：
 * 打包后 Electron 的 PATH 被裁剪，`npx` 可能解析不到。届时应改为预装该包并把
 * command 指向绝对 node + 绝对 dist/index.js。dev 阶段先用 npx。
 */
export function writeStockMcpConfig(): string {
  const dir = path.join(app.getPath('userData'), 'mcp')
  mkdirSync(dir, { recursive: true })
  const cfgPath = path.join(dir, 'stock-mcp.json')
  const config = {
    mcpServers: {
      [MCP_SERVER_NAME]: {
        command: 'npx',
        args: ['-y', STOCK_MCP_PKG]
      }
    }
  }
  writeFileSync(cfgPath, JSON.stringify(config, null, 2), 'utf8')
  return cfgPath
}
