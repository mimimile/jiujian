import type { DetectResult, RunRequest } from '@shared/types'

/** 一次运行的 spawn 计划：编排器据此 spawn，与具体鉴权方式解耦。 */
export interface SpawnPlan {
  binaryPath: string
  args: string[]
  /** 写入子进程 stdin 的内容（通常是 prompt） */
  stdin: string
  env: NodeJS.ProcessEnv
}

/**
 * 可插拔鉴权 provider。D10：当前只实现订阅 CLI（SubscriptionCliProvider）。
 * 未来要支持 API key / Agent SDK，只需新增一个实现，编排器与 IPC 层不变。
 */
export interface AuthProvider {
  readonly id: string
  /** 探测可用性与登录态 */
  detect(): Promise<DetectResult>
  /** 为一次运行构造 spawn 计划 */
  buildSpawnPlan(req: RunRequest, mcpConfigPath: string): Promise<SpawnPlan>
}
