import { app, type BrowserWindow } from 'electron'
import { writeFile } from 'node:fs/promises'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/**
 * 端到端自检钩子（仅当设置 JJ_E2E=输出png路径 时启用，平时零影响）。
 * JJ_E2E_MODE=analyze(默认) → 点「分析」；=recap → 种自选+reload+点「复盘」。
 * 流程：启动 → 触发 → 等完成 → 截图渲染层 → 退出。验证真机整条链。
 */
export function maybeRunE2E(win: BrowserWindow): void {
  const out = process.env.JJ_E2E
  if (!out) return
  const mode = process.env.JJ_E2E_MODE === 'recap' ? 'recap' : 'analyze'

  win.webContents.once('did-finish-load', async () => {
    try {
      if (mode === 'recap') {
        await win.webContents.executeJavaScript(
          `localStorage.setItem('jj.watchlist', JSON.stringify([{symbol:'sh600519',market:'A'},{symbol:'00700',market:'HK'},{symbol:'sz000858',market:'A'}]))`
        )
        await win.webContents.reload()
        await sleep(1800)
      }
      const needle = mode === 'recap' ? '复盘' : '分析'
      const clicked = await win.webContents.executeJavaScript(
        `(async () => {
          for (let i = 0; i < 40; i++) {
            const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('${needle}'));
            if (b && !b.disabled) { b.click(); return true }
            await new Promise((r) => setTimeout(r, 500));
          }
          return false;
        })()`
      )
      console.log(`[E2E:${mode}] triggered =`, clicked)

      let done = false
      for (let i = 0; i < 100; i++) {
        done = await win.webContents.executeJavaScript(
          `document.body.innerText.includes('计入本月 Agent SDK') || document.body.innerText.includes('分析失败')`
        )
        if (done) break
        await sleep(1000)
      }
      console.log(`[E2E:${mode}] done =`, done)
      await sleep(1000)

      const img = await win.webContents.capturePage()
      await writeFile(out, img.toPNG())
      console.log(`[E2E:${mode}] captured ->`, out)
    } catch (e) {
      console.error('[E2E] error', e)
    } finally {
      app.quit()
    }
  })
}
