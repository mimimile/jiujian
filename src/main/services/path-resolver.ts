import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, accessSync, constants } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const execFileAsync = promisify(execFile)

let cachedBinary: string | null | undefined
let pathFixed = false

function isExecutable(p: string): boolean {
  try {
    if (!p || !existsSync(p)) return false
    accessSync(p, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function expandHome(p: string): string {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p
}

/**
 * macOS/Linux 的 GUI 应用（Finder/Dock 启动）不继承 login-shell 的 PATH，
 * 导致 spawn('claude') 在打包后报 ENOENT。这里把登录 shell 的真实 PATH 导入 process.env.PATH。
 * 等价于 sindresorhus/fix-path，自己实现以免引入 ESM-only 依赖。
 */
export async function fixLoginPath(): Promise<void> {
  if (pathFixed || process.platform === 'win32') {
    pathFixed = true
    return
  }
  try {
    const shell = process.env.SHELL || '/bin/zsh'
    // 用 sentinel 包裹真实 PATH，隔离用户 .zshrc 可能打印到 stdout 的横幅/噪音
    const { stdout } = await execFileAsync(
      shell,
      ['-ilc', 'printf "__JJPATH__%s__JJEND__" "$PATH"'],
      { timeout: 6000, encoding: 'utf8' }
    )
    const real = stdout.match(/__JJPATH__([\s\S]*?)__JJEND__/)?.[1]?.trim()
    if (real) {
      const merged = new Set(
        [...real.split(':'), ...(process.env.PATH || '').split(':')].filter(Boolean)
      )
      process.env.PATH = [...merged].join(':')
    }
  } catch {
    // 忽略：继续用现有 PATH + 兜底扫描
  }
  pathFixed = true
}

const COMMON_DIRS = ['~/.local/bin', '/opt/homebrew/bin', '/usr/local/bin', '~/.bun/bin']

async function resolveViaShell(): Promise<string | null> {
  const shell = process.env.SHELL || '/bin/zsh'
  const isZsh = /zsh/.test(shell)
  // 打印多个候选（每行一个），Node 取首个「存在且可执行」的文件路径。
  // 用 -i 触发用户 .zshrc 里的 alias 定义；其打印的横幅/噪音行会被 isExecutable 自动滤掉。
  // 候选顺序：alias 目标（镜像用户真实 `claude` 行为，可能带代理包装）-> PATH 真实二进制 -> command -v。
  const script = isZsh
    ? 'print -r -- "${aliases[claude]}" 2>/dev/null; whence -p claude 2>/dev/null; command -v claude 2>/dev/null'
    : 'type -P claude 2>/dev/null; command -v claude 2>/dev/null'
  try {
    const { stdout } = await execFileAsync(shell, ['-ilc', script], {
      timeout: 6000,
      encoding: 'utf8'
    })
    const candidate = stdout
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l && isExecutable(l))
    return candidate || null
  } catch {
    return null
  }
}

async function resolveViaWhere(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('where', ['claude'], {
      timeout: 5000,
      encoding: 'utf8'
    })
    const candidate = stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && existsSync(l))
    return candidate || null
  } catch {
    return null
  }
}

/**
 * 解析 claude 二进制的可执行绝对路径。userOverride 优先；结果缓存。
 * 返回 null 表示未找到。
 */
export async function resolveClaudeBinary(userOverride?: string): Promise<string | null> {
  if (userOverride && isExecutable(userOverride)) return userOverride
  if (cachedBinary !== undefined) return cachedBinary

  await fixLoginPath()

  let found: string | null
  if (process.platform === 'win32') {
    found = await resolveViaWhere()
  } else {
    found = await resolveViaShell()
    if (!found) {
      for (const dir of COMMON_DIRS) {
        const p = path.join(expandHome(dir), 'claude')
        if (isExecutable(p)) {
          found = p
          break
        }
      }
    }
  }
  cachedBinary = found ?? null
  return cachedBinary
}

/** 清缓存（用户改了覆盖路径 / 重新探测时调用）。 */
export function clearBinaryCache(): void {
  cachedBinary = undefined
  pathFixed = false
}
