// ============================================================
// 剪贴板工具：优先使用异步剪贴板 API，失败时退回 execCommand
// ============================================================

/** 复制文本，返回是否成功 */
export async function copyText(text: string): Promise<boolean> {
  const value = text.trim()
  if (!value) return false

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // 非 HTTPS 或权限被拒绝时继续走兜底方案
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
