import { spawn, type ChildProcess } from 'node:child_process'
import readline from 'node:readline'
import { randomUUID } from 'node:crypto'
import type { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { ClaudeEvent, ClaudeErrorCode, RunId, RunRequest } from '@shared/types'
import type { AuthProvider } from './auth/auth-provider'
import { writeStockMcpConfig } from './mcp-config'

interface ActiveRun {
  child: ChildProcess
  controller: AbortController
  killTimer?: NodeJS.Timeout
}

/**
 * 编排器（核心）：spawn 用户的 `claude -p`（挂 stock-sdk MCP），把 stream-json 逐行解析后
 * 经 IPC 推给渲染层。与具体鉴权方式解耦（通过 AuthProvider）。
 */
export class ClaudeOrchestrator {
  private runs = new Map<RunId, ActiveRun>()
  private mcpConfigPath: string | null = null

  constructor(private provider: AuthProvider) {}

  private getMcpConfig(): string {
    if (!this.mcpConfigPath) this.mcpConfigPath = writeStockMcpConfig()
    return this.mcpConfigPath
  }

  async run(req: RunRequest, win: BrowserWindow): Promise<RunId> {
    const runId = randomUUID()
    const controller = new AbortController()
    const startedAt = Date.now()

    const emit = (e: ClaudeEvent): void => {
      if (!win.isDestroyed()) win.webContents.send(IPC.CLAUDE_EVENT, e)
    }

    let plan
    try {
      plan = await this.provider.buildSpawnPlan(req, this.getMcpConfig())
    } catch (err) {
      emit({ type: 'error', runId, message: errMsg(err), code: 'NOT_FOUND' })
      return runId
    }

    let child: ChildProcess
    try {
      child = spawn(plan.binaryPath, plan.args, {
        shell: false,
        env: plan.env,
        signal: controller.signal,
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (err) {
      emit({ type: 'error', runId, message: errMsg(err), code: 'SPAWN_ERROR' })
      return runId
    }

    this.runs.set(runId, { child, controller })
    emit({ type: 'started', runId })

    // prompt 经 stdin 传入（避免超长/特殊字符进 argv）
    child.stdin?.write(plan.stdin)
    child.stdin?.end()

    let finalText = ''
    let costUsd: number | null = null
    let stderrBuf = ''

    if (child.stdout) {
      const rl = readline.createInterface({ input: child.stdout })
      rl.on('line', (line) => {
        const trimmed = line.trim()
        if (!trimmed) return
        let evt: Record<string, unknown>
        try {
          evt = JSON.parse(trimmed)
        } catch {
          return // 非 JSON 行忽略（readline 已处理跨 chunk 分行）
        }
        const parsed = normalizeStreamEvent(evt, runId)
        if (parsed) {
          if (parsed.type === 'text') finalText += parsed.delta
          emit(parsed)
        }
        // 终局 result 事件：成本 + 规范化最终文本
        if (evt.type === 'result') {
          if (typeof evt.total_cost_usd === 'number') costUsd = evt.total_cost_usd
          if (typeof evt.result === 'string' && evt.result) finalText = evt.result
        }
      })
    }

    child.stderr?.on('data', (d: Buffer) => {
      stderrBuf += d.toString()
    })

    child.on('error', (err: NodeJS.ErrnoException) => {
      this.cleanup(runId)
      const code: ClaudeErrorCode = controller.signal.aborted
        ? 'CANCELLED'
        : err.code === 'ENOENT'
          ? 'NOT_FOUND'
          : 'SPAWN_ERROR'
      emit({ type: 'error', runId, message: errMsg(err), code })
    })

    child.on('close', (exitCode) => {
      this.cleanup(runId)
      if (controller.signal.aborted) {
        emit({ type: 'error', runId, message: '已取消', code: 'CANCELLED' })
        return
      }
      if (exitCode === 0) {
        emit({ type: 'done', runId, text: finalText, costUsd, durationMs: Date.now() - startedAt })
      } else {
        emit({
          type: 'error',
          runId,
          message: classifyMessage(exitCode, stderrBuf),
          code: classifyCode(exitCode, stderrBuf)
        })
      }
    })

    return runId
  }

  cancel(runId: RunId): boolean {
    const run = this.runs.get(runId)
    if (!run) return false
    run.controller.abort() // 发 SIGTERM，但不保证立即退出
    run.killTimer = setTimeout(() => {
      if (!run.child.killed) {
        try {
          run.child.kill('SIGKILL')
        } catch {
          /* ignore */
        }
      }
    }, 3000)
    return true
  }

  /** 应用退出时清理所有子进程，避免孤儿 claude / npx / MCP 进程。 */
  killAll(): void {
    for (const [, run] of this.runs) {
      run.controller.abort()
      if (run.killTimer) clearTimeout(run.killTimer)
      try {
        run.child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
    }
    this.runs.clear()
  }

  private cleanup(runId: RunId): void {
    const run = this.runs.get(runId)
    if (run?.killTimer) clearTimeout(run.killTimer)
    this.runs.delete(runId)
  }
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** 把 stream-json 原始事件归一化为渲染层用的 ClaudeEvent（只取增量文本与工具开始）。 */
function normalizeStreamEvent(evt: Record<string, any>, runId: RunId): ClaudeEvent | null {
  // 1) 增量文本（--include-partial-messages）
  if (evt.type === 'stream_event' && evt.event?.type === 'content_block_delta') {
    const delta = evt.event.delta
    if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
      return { type: 'text', runId, delta: delta.text }
    }
  }
  // 2) 工具调用开始
  if (
    evt.type === 'stream_event' &&
    evt.event?.type === 'content_block_start' &&
    evt.event.content_block?.type === 'tool_use'
  ) {
    return { type: 'tool', runId, name: evt.event.content_block.name ?? 'tool', phase: 'start' }
  }
  return null
}

function classifyCode(exitCode: number | null, stderr: string): ClaudeErrorCode {
  if (exitCode === 127) return 'NOT_FOUND'
  if (/402|payment required|credit|exhaust|insufficient|quota/i.test(stderr)) {
    return 'CREDIT_EXHAUSTED'
  }
  if (/not logged in|unauthor|login|auth/i.test(stderr)) return 'NOT_LOGGED_IN'
  return 'UNKNOWN'
}

function classifyMessage(exitCode: number | null, stderr: string): string {
  const code = classifyCode(exitCode, stderr)
  const map: Record<ClaudeErrorCode, string> = {
    NOT_FOUND: '未找到 claude（请确认已安装 Claude Code 且在 PATH 中）',
    NOT_LOGGED_IN: '未登录（请运行 claude auth login）',
    CREDIT_EXHAUSTED: '本月 Agent SDK 额度可能已用尽（402）',
    CANCELLED: '已取消',
    SPAWN_ERROR: '启动 claude 失败',
    UNKNOWN: `claude 异常退出（code ${exitCode}）`
  }
  const tail = stderr.trim().slice(0, 300)
  return tail ? `${map[code]}：${tail}` : map[code]
}
