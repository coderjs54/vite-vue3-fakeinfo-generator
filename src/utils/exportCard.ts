// ============================================================
// 卡面导出：直接把 DOM 卡片截图成图片（html-to-image）
// 与原站行为一致：3600 × 2400 的节点按 pixelRatio 0.5 导出 → 1800 × 1200 JPEG
// ============================================================

import { getFontEmbedCSS, toJpeg } from 'html-to-image'
import { waitHeadPhoto } from '@/renderer/headPhoto'

/** 导出倍率，0.5 对应 1800 × 1200 */
const EXPORT_PIXEL_RATIO = 0.5

/** 字体内嵌 CSS 只计算一次，避免每次导出都重新抓取几 MB 的字体文件 */
let fontEmbedCSS: string | null = null

/**
 * 预热卡面字体
 * 名字字体有数 MB，提前加载可以避免第一次打开预览时出现字体闪烁
 */
export function preloadCardFonts(): Promise<void> {
  const loads = [
    document.fonts.load('400 100px font_name'),
    document.fonts.load('200 100px font_born'),
    document.fonts.load('200 100px font_number'),
  ]
  return Promise.all(loads)
    .then(() => undefined)
    .catch(() => undefined)
}

/** 预先计算并缓存字体内嵌样式（可在弹窗打开时预热） */
export async function prepareFontEmbedCSS(node: HTMLElement): Promise<void> {
  if (fontEmbedCSS !== null) return
  try {
    fontEmbedCSS = await getFontEmbedCSS(node)
  } catch {
    // 字体抓取失败时退回默认行为，由 html-to-image 自行处理
    fontEmbedCSS = ''
  }
}

/**
 * 把卡面节点导出成 JPEG dataURL
 * @param node 卡面根节点（.id-card）
 */
export async function exportCardImage(node: HTMLElement): Promise<string> {
  // 等字体与头像就绪，否则会截到回退字体或空头像
  await document.fonts.ready
  await waitHeadPhoto()
  await prepareFontEmbedCSS(node)

  return toJpeg(node, {
    quality: 1,
    pixelRatio: EXPORT_PIXEL_RATIO,
    fontEmbedCSS: fontEmbedCSS ?? '',
  })
}

/** 触发浏览器下载（dataURL 形式，与原站一致） */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
