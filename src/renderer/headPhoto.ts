// ============================================================
// 证件照头像处理
// 预设头像是带透明通道的抠图（400 × 500），为让它看起来像"印"在卡面上，
// 这里复刻原站的处理流程：
//   1) 拉伸/裁切绘制到 960 × 1200 画布
//   2) 复制一份做 3px 高斯模糊，逐像素叠加 ±25 的随机噪点后写回
//   3) 以 6px 为边长铺满向下三角形，用格子中心色填充，形成低多边形质感
// 处理结果再交给 CSS 做 1px 模糊 + 70% 不透明度 + 边缘羽化。
// ============================================================

/** 头像画布尺寸（与卡面照片区一致） */
export const HEAD_WIDTH = 960
export const HEAD_HEIGHT = 1200
/** 三角网格边长 */
const GRID = 6
/** 三角形顶点内缩量 */
const INSET = 2
/** 顶点内缩后在对角线方向的偏移 */
const OFFSET = INSET / Math.SQRT2
/** 噪点强度（±半个振幅） */
const NOISE_AMPLITUDE = 50

/** 最近一次头像渲染任务，导出前需要等它完成，否则截到空画布 */
let pendingRender: Promise<void> = Promise.resolve()
/** 渲染序号：图片加载是异步的，用它丢弃过期请求，避免后发起的渲染被先发起的覆盖 */
let renderToken = 0

/** 等待头像渲染完成 */
export function waitHeadPhoto(): Promise<void> {
  return pendingRender
}

/** 加载图片资源 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('头像加载失败'))
    image.src = src
  })
}

/** 数值截断到 [0, 255] */
function clampByte(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value
}

/**
 * 把头像绘制到目标画布（含噪点与低多边形处理）
 * @param canvas 目标画布，需为 960 × 1200
 * @param src 头像地址（预设抠图或用户上传的照片）
 */
export function renderHeadPhoto(canvas: HTMLCanvasElement, src: string): Promise<void> {
  const token = ++renderToken
  pendingRender = drawHeadPhoto(canvas, src, token).catch((error: unknown) => {
    console.warn('[head-photo] 头像渲染失败', error)
  })
  return pendingRender
}

async function drawHeadPhoto(canvas: HTMLCanvasElement, src: string, token: number): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx || !src) return

  const image = await loadImage(src)
  // 期间如果切换了头像（例如先男后女），丢弃这次过期的渲染
  if (token !== renderToken) return

  const { width, height } = canvas

  // 1. 等比裁切铺满画布（预设头像本身是 0.8 比例，等于原样拉伸）
  ctx.clearRect(0, 0, width, height)
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)

  // 2. 模糊 + 噪点：让照片带一点翻拍颗粒感
  const layer = document.createElement('canvas')
  layer.width = width
  layer.height = height
  const layerCtx = layer.getContext('2d')
  if (!layerCtx) return
  layerCtx.filter = 'blur(3px)'
  layerCtx.drawImage(canvas, 0, 0, width, height)

  const imageData = layerCtx.getImageData(0, 0, width, height)
  const pixels = imageData.data
  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * NOISE_AMPLITUDE
    pixels[i] = clampByte(pixels[i] + noise)
    pixels[i + 1] = clampByte(pixels[i + 1] + noise)
    pixels[i + 2] = clampByte(pixels[i + 2] + noise)
  }
  ctx.putImageData(imageData, 0, 0)

  // 3. 低多边形：每个格子画一个向下的等边三角形
  for (let y = 0; y < height + GRID; y += GRID) {
    for (let x = 0; x < width + GRID; x += GRID) {
      const sampleX = Math.min(Math.floor(x + GRID / 2), width - 1)
      const sampleY = Math.min(Math.floor(y + GRID / 2), height - 1)
      const offset = (sampleY * width + sampleX) * 4

      ctx.beginPath()
      ctx.moveTo(x + INSET / 2, y + OFFSET)
      ctx.lineTo(x + GRID / 2, y + GRID - OFFSET)
      ctx.lineTo(x + GRID - INSET / 2, y + OFFSET)
      ctx.closePath()
      ctx.fillStyle = `rgba(${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]},${
        pixels[offset + 3] / 255
      })`
      ctx.fill()
    }
  }
}
