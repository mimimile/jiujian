import { Menu, Tray, nativeImage, type BrowserWindow } from 'electron'

// 44x44 烛台模板图（黑+透明），菜单栏自动适配明暗。内嵌 dataURL 避免运行时文件路径问题。
const TRAY_ICON_DATAURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAAtElEQVR4AezVgQqAIAxF0er//7lcOJAsFNmDxBvZSscYx8Bjm+yiYfWGIZyFzxRtpBB7IxzrWVdDuDaJnUE41rOuhnBtEjuzhLCdYK3hrK08W/fcrriEcJeEKglhlazXRdglVBFhlazX/RT2hL9FGlbvCMIIPwT4JR4g4Z8jwnvqojVSyn238mz9Tux9jDTcW1uSR8MS1qIowgWG5BVhCWtRFOGMYQeCjfwZFxCOs3yvNJ3wBQAA///h92DPAAAABklEQVQDAC8EFFl1I0LfAAAAAElFTkSuQmCC'

let tray: Tray | null = null

/**
 * 菜单栏 tray：打开窗口 / 立即复盘 / 退出。配合 close-to-tray 实现后台常驻。
 */
export function setupTray(
  getWindow: () => BrowserWindow | null,
  onTriggerRecap: () => void,
  onQuit: () => void
): void {
  if (tray) return
  const img = nativeImage.createFromDataURL(TRAY_ICON_DATAURL)
  img.setTemplateImage(true)
  tray = new Tray(img)
  tray.setToolTip('韭见 JiuJian')

  const show = (): void => {
    const w = getWindow()
    if (w) {
      w.show()
      w.focus()
    }
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '打开韭见', click: show },
      { label: '立即复盘', click: onTriggerRecap },
      { type: 'separator' },
      { label: '退出', click: onQuit }
    ])
  )
  tray.on('click', show)
}
