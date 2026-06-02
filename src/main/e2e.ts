import { app, type BrowserWindow } from 'electron'
import { writeFile } from 'node:fs/promises'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/**
 * 端到端自检钩子（仅当设置 JJ_E2E=输出png路径 时启用，平时零影响）。
 * 启动后自动：等探测就绪 → 点「分析」(真 claude) → 等完成 → 截图渲染层 → 退出。
 * 用于真机验证整条链：renderer → IPC → main → spawn claude → 流式 → 图表/报告。
 */
export function maybeRunE2E(win: BrowserWindow): void {
  const out = process.env.JJ_E2E
  if (!out) return

  win.webContents.once('did-finish-load', async () => {
    try {
      // 1) 等探测就绪并点「分析」（最多 20s）
      const clicked = await win.webContents.executeJavaScript(
        `(async () => {
          for (let i = 0; i < 40; i++) {
            const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '分析');
            if (b && !b.disabled) { b.click(); return true }
            await new Promise((r) => setTimeout(r, 500));
          }
          return false;
        })()`
      )
      console.log('[E2E] analyze clicked =', clicked)

      // 2) 等分析完成（成本 footer 出现 = done），最多 90s
      let done = false
      for (let i = 0; i < 90; i++) {
        done = await win.webContents.executeJavaScript(
          `document.body.innerText.includes('计入本月 Agent SDK') || document.body.innerText.includes('分析失败')`
        )
        if (done) break
        await sleep(1000)
      }
      console.log('[E2E] analysis done =', done)
      await sleep(1000)

      // 3) 截图渲染层
      const img = await win.webContents.capturePage()
      await writeFile(out, img.toPNG())
      console.log('[E2E] captured ->', out)
    } catch (e) {
      console.error('[E2E] error', e)
    } finally {
      app.quit()
    }
  })
}
