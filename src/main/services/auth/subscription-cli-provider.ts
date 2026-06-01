import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DetectResult, RunRequest } from '@shared/types'
import { resolveClaudeBinary } from '../path-resolver'
import { allowedToolsFor } from '../analysis-tools'
import type { AuthProvider, SpawnPlan } from './auth-provider'

const execFileAsync = promisify(execFile)

/**
 * 订阅 CLI provider：驱动用户本机已登录的 Claude Code（订阅 OAuth），无头跑 `claude -p`。
 * D2/D9：个人非商业自用，属 "ordinary individual usage of your own Claude Code"。
 */
export class SubscriptionCliProvider implements AuthProvider {
  readonly id = 'subscription-cli'

  constructor(private userOverride?: string) {}

  async detect(): Promise<DetectResult> {
    const binaryPath = await resolveClaudeBinary(this.userOverride)
    if (!binaryPath) {
      return {
        found: false,
        binaryPath: null,
        version: null,
        loggedIn: false,
        authMethod: null,
        plan: null,
        error: '未找到 claude（请确认已安装 Claude Code 且在 PATH 中）'
      }
    }

    let version: string | null = null
    try {
      const { stdout } = await execFileAsync(binaryPath, ['--version'], {
        timeout: 5000,
        encoding: 'utf8'
      })
      version = stdout.trim()
    } catch {
      // 取不到版本不致命
    }

    let loggedIn = false
    let authMethod: string | null = null
    let plan: string | null = null
    try {
      const { stdout } = await execFileAsync(binaryPath, ['auth', 'status', '--json'], {
        timeout: 8000,
        encoding: 'utf8'
      })
      const parsed = JSON.parse(stdout) as Record<string, unknown>
      loggedIn = parsed.authenticated === true || parsed.loggedIn === true
      authMethod = (parsed.method as string) ?? (parsed.authMethod as string) ?? null
      plan = (parsed.plan as string) ?? null
    } catch {
      // --json 可能不被支持：退回 exit code 判断
      try {
        await execFileAsync(binaryPath, ['auth', 'status'], { timeout: 8000 })
        loggedIn = true
      } catch {
        loggedIn = false
      }
    }

    return { found: true, binaryPath, version, loggedIn, authMethod, plan }
  }

  async buildSpawnPlan(req: RunRequest, mcpConfigPath: string): Promise<SpawnPlan> {
    const binaryPath = await resolveClaudeBinary(this.userOverride)
    if (!binaryPath) throw new Error('未找到 claude')

    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--include-partial-messages',
      // 只加载我们指定的 MCP，屏蔽用户机器上的其它 MCP server
      '--strict-mcp-config',
      '--mcp-config',
      mcpConfigPath,
      // 按市场精选工具放行（不用 ToolSearch）。实测降本 ~43%，详见 analysis-tools.ts。
      '--allowedTools',
      allowedToolsFor(req.market ?? 'A')
    ]

    return {
      binaryPath,
      args,
      stdin: req.prompt,
      env: { ...process.env }
    }
  }
}
