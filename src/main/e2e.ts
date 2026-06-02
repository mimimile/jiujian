import { app, type BrowserWindow } from 'electron'
import { writeFile } from 'node:fs/promises'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/**
 * 端到端自检钩子（仅当设置 JJ_E2E=输出png路径 时启用，平时零影响）。
 * JJ_E2E_MODE: analyze(默认) | recap | boot | tray | schedule
 *   - analyze/recap：触发分析/复盘，截图渲染层
 *   - boot：仅启动+截图（零成本）
 *   - tray：测后台常驻（开机自启注册 + 关窗缩 tray 不销毁），程序化校验，测完复位 login item
 *   - schedule：测定时自动复盘（设 ~70s 后触发，等其自动跑完）
 */
export function maybeRunE2E(win: BrowserWindow): void {
  const out = process.env.JJ_E2E
  if (!out) return
  const mode = process.env.JJ_E2E_MODE || 'analyze'

  win.webContents.once('did-finish-load', async () => {
    try {
      if (mode === 'tray') {
        await runTrayTest(win)
        return
      }
      if (mode === 'schedule') {
        await runScheduleTest(win, out)
        return
      }
      if (mode === 'boot') {
        await sleep(2500)
        await capture(win, out)
        console.log('[E2E:boot] captured ->', out)
        app.quit()
        return
      }

      // analyze / recap
      if (mode === 'recap') {
        await win.webContents.executeJavaScript(
          `localStorage.setItem('jj.watchlist', JSON.stringify([{symbol:'sh600519',market:'A'},{symbol:'00700',market:'HK'},{symbol:'sz000858',market:'A'}]))`
        )
        await win.webContents.reload()
        await sleep(1800)
      }
      const needle = mode === 'recap' ? '复盘' : '分析'
      const clicked = await clickButton(win, needle)
      console.log(`[E2E:${mode}] triggered =`, clicked)
      await waitDone(win, 100)
      await sleep(1000)
      await capture(win, out)
      console.log(`[E2E:${mode}] captured ->`, out)
    } catch (e) {
      console.error('[E2E] error', e)
    } finally {
      app.quit()
    }
  })
}

async function runTrayTest(win: BrowserWindow): Promise<void> {
  const log = (...a: unknown[]): void => console.log('[E2E:tray]', ...a)
  try {
    await sleep(1500)
    // 开启后台常驻（→ setLoginItemSettings + backgroundMode=true）
    await win.webContents.executeJavaScript('window.api.system.setBackgroundMode(true)')
    await sleep(400)
    log('openAtLogin registered =', app.getLoginItemSettings().openAtLogin)

    // 关窗 → 应缩 tray（hide），不销毁
    win.close()
    await sleep(800)
    const destroyed = win.isDestroyed()
    log('after close → destroyed =', destroyed, '| visible =', destroyed ? 'n/a' : win.isVisible())
    log('close-to-tray OK =', !destroyed && !win.isVisible())
  } catch (e) {
    console.error('[E2E:tray] error', e)
  } finally {
    // 复位 login item，避免给用户机器留自启
    try {
      app.setLoginItemSettings({ openAtLogin: false, openAsHidden: false })
      console.log('[E2E:tray] login item reset → false =', !app.getLoginItemSettings().openAtLogin)
    } catch {
      /* ignore */
    }
    app.exit(0)
  }
}

async function runScheduleTest(win: BrowserWindow, out: string): Promise<void> {
  const log = (...a: unknown[]): void => console.log('[E2E:schedule]', ...a)
  try {
    const scheduled = await win.webContents.executeJavaScript(`(() => {
      localStorage.setItem('jj.watchlist', JSON.stringify([{symbol:'sh600519',market:'A'},{symbol:'00700',market:'HK'}]));
      const t = new Date(Date.now() + 70000);
      const hh = String(t.getHours()).padStart(2,'0');
      const mm = String(t.getMinutes()).padStart(2,'0');
      localStorage.setItem('jj.autorecap', JSON.stringify({ enabled:true, time: hh+':'+mm }));
      localStorage.removeItem('jj.autorecap.fired');
      return hh+':'+mm;
    })()`)
    await win.webContents.reload()
    log('scheduled time =', scheduled, '→ 等自动触发…')
    const done = await waitDone(win, 140)
    log('auto recap fired & done =', done)
    await sleep(1000)
    await capture(win, out)
    log('captured ->', out)
  } catch (e) {
    console.error('[E2E:schedule] error', e)
  } finally {
    app.quit()
  }
}

async function clickButton(win: BrowserWindow, needle: string): Promise<boolean> {
  return win.webContents.executeJavaScript(
    `(async () => {
      for (let i = 0; i < 40; i++) {
        const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(${JSON.stringify(needle)}));
        if (b && !b.disabled) { b.click(); return true }
        await new Promise((r) => setTimeout(r, 500));
      }
      return false;
    })()`
  )
}

async function waitDone(win: BrowserWindow, maxSec: number): Promise<boolean> {
  for (let i = 0; i < maxSec; i++) {
    const done = await win.webContents.executeJavaScript(
      `document.body.innerText.includes('计入本月 Agent SDK') || document.body.innerText.includes('分析失败')`
    )
    if (done) return true
    await sleep(1000)
  }
  return false
}

async function capture(win: BrowserWindow, out: string): Promise<void> {
  const img = await win.webContents.capturePage()
  await writeFile(out, img.toPNG())
}
