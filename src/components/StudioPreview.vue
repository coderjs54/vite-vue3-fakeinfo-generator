<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IdCard from '@/components/card/IdCard.vue'
import type { CardSide, IdCardInfo } from '@/types'
import { downloadDataUrl, exportCardImage } from '@/utils/exportCard'

/** 卡面设计尺寸，与底图一致 */
const CARD_WIDTH = 3600
const CARD_HEIGHT = 2400
/** 预览区内部留白 */
const BOARD_PADDING = 20
/** 卡面标题行高度（含与卡片的间距） */
const LABEL_HEIGHT = 22
/** 两张卡面之间的间距 */
const CARD_GAP = 14

const props = defineProps<{
  /** 卡面信息，号码不完整时也会用占位数据渲染 */
  info: IdCardInfo | null
  /** 头像地址：上传照片或预设真人头像 */
  headSrc: string
  /** 是否生成背面（签发机关与有效期限齐全时才有） */
  hasBack: boolean
  /** 是否叠加测试水印 */
  watermark: boolean
  /** 表单是否通过校验，未通过时禁止导出 */
  canExport: boolean
}>()

const emit = defineEmits<{
  (event: 'update:watermark', value: boolean): void
}>()

/** 展示模式：双面 / 人像面 / 信息面 */
type BoardTab = 'both' | 'front' | 'back'
const tab = ref<BoardTab>('both')

const boardRef = ref<HTMLElement | null>(null)
const previewScale = ref(0.18)
const saving = ref(false)
/** 导出时临时挂载的离屏卡面（只渲染要导出的那一面） */
const exportSide = ref<CardSide | null>(null)
const exportRef = ref<HTMLElement | null>(null)

const tabs: Array<{ value: BoardTab; label: string }> = [
  { value: 'both', label: '双面' },
  { value: 'front', label: '人像面' },
  { value: 'back', label: '信息面' },
]

/** 当前需要展示的卡面 */
const visibleCards = computed<Array<{ side: CardSide; label: string; sub: string }>>(() => {
  const front = { side: 'front' as CardSide, label: '人像面', sub: 'FRONT SIDE' }
  const back = { side: 'back' as CardSide, label: '信息面', sub: 'BACK SIDE' }

  if (tab.value === 'front') return [front]
  if (tab.value === 'back') return props.hasBack ? [back] : []
  return props.hasBack ? [front, back] : [front]
})

/** 信息面不可用时的占位提示 */
const showBackEmpty = computed(() => tab.value === 'back' && !props.hasBack)

/** 缩放后的卡面尺寸 */
const frameWidth = computed(() => `${Math.round(CARD_WIDTH * previewScale.value)}px`)
const frameHeight = computed(() => `${Math.round(CARD_HEIGHT * previewScale.value)}px`)

let resizeObserver: ResizeObserver | null = null

/**
 * 同时按容器宽高计算缩放比
 * 双面模式要保证两张卡都完整落在可视区域内，因此高度权重更大
 */
function measure(): void {
  const board = boardRef.value
  if (!board) return

  const count = Math.max(visibleCards.value.length, 1)
  const availableWidth = board.clientWidth - BOARD_PADDING * 2
  const availableHeight =
    board.clientHeight - BOARD_PADDING * 2 - count * LABEL_HEIGHT - (count - 1) * CARD_GAP
  if (availableWidth <= 0 || availableHeight <= 0) return

  const scaleByWidth = availableWidth / CARD_WIDTH
  const scaleByHeight = availableHeight / count / CARD_HEIGHT
  previewScale.value = Math.max(0.04, Math.min(scaleByWidth, scaleByHeight, 0.5))
}

onMounted(() => {
  measure()
  if (!boardRef.value) return
  resizeObserver = new ResizeObserver(measure)
  resizeObserver.observe(boardRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// 切换标签或背面可用性变化后，重新计算可用高度
watch(visibleCards, () => {
  void nextTick(measure)
})

function handleWatermarkChange(event: Event): void {
  emit('update:watermark', (event.target as HTMLInputElement).checked)
}

/** 离屏渲染指定的一面并导出为 JPEG dataURL */
async function captureSide(side: CardSide): Promise<string | null> {
  exportSide.value = side
  await nextTick()
  const node = exportRef.value?.querySelector<HTMLElement>('.id-card')
  if (!node) return null
  try {
    return await exportCardImage(node)
  } finally {
    exportSide.value = null
  }
}

/** 保存当前标签页对应的那一面（双面模式下保存人像面） */
async function handleSaveCurrent(): Promise<void> {
  if (!props.canExport || saving.value) return
  saving.value = true
  try {
    const side: CardSide = tab.value === 'back' ? 'back' : 'front'
    const dataUrl = await captureSide(side)
    if (dataUrl) downloadDataUrl(dataUrl, side === 'front' ? '身份证正面.jpg' : '身份证背面.jpg')
  } catch (error) {
    console.error('[export] 导出失败', error)
  } finally {
    saving.value = false
  }
}

/** 一次性保存正反面 */
async function handleSaveBoth(): Promise<void> {
  if (!props.canExport || saving.value) return
  saving.value = true
  try {
    const sides: CardSide[] = props.hasBack ? ['front', 'back'] : ['front']
    for (const side of sides) {
      const dataUrl = await captureSide(side)
      if (dataUrl) downloadDataUrl(dataUrl, side === 'front' ? '身份证正面.jpg' : '身份证背面.jpg')
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  } catch (error) {
    console.error('[export] 导出失败', error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="studio-preview">
    <header class="studio-preview-head">
      <div class="studio-preview-tabs" role="tablist" aria-label="卡面预览切换">
        <button
          v-for="item in tabs"
          :key="item.value"
          type="button"
          role="tab"
          class="studio-preview-tab"
          :class="{ 'studio-preview-tab-active': tab === item.value }"
          :aria-selected="tab === item.value"
          @click="tab = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="studio-preview-actions">
        <label class="studio-preview-watermark">
          <input type="checkbox" :checked="watermark" @change="handleWatermarkChange" />
          <span>测试水印</span>
        </label>
        <span class="studio-preview-divider" aria-hidden="true"></span>
        <button
          type="button"
          class="studio-preview-button"
          :disabled="!canExport || saving"
          @click="handleSaveBoth"
        >
          保存正反面
        </button>
        <button
          type="button"
          class="studio-preview-button studio-preview-button-primary"
          :disabled="!canExport || saving"
          @click="handleSaveCurrent"
        >
          {{ saving ? '导出中…' : '保存当前面' }}
        </button>
      </div>
    </header>

    <p v-if="!canExport" class="studio-preview-blocked">左侧资料未通过校验，补全后即可保存图片</p>

    <div ref="boardRef" class="studio-preview-board">
      <article
        v-for="card in visibleCards"
        :key="card.side"
        class="studio-preview-card"
        :style="{ width: frameWidth }"
      >
        <header class="studio-preview-card-head">
          <span class="studio-preview-card-label">{{ card.label }}</span>
          <span class="studio-preview-card-sub">{{ card.sub }}</span>
        </header>
        <div class="studio-preview-frame" :style="{ height: frameHeight }">
          <div class="studio-preview-scaler" :style="{ transform: `scale(${previewScale})` }">
            <IdCard
              v-if="info"
              :side="card.side"
              :info="info"
              :head-src="headSrc"
              :watermark="watermark"
            />
          </div>
        </div>
      </article>

      <div v-if="showBackEmpty" class="studio-preview-empty">
        <p class="studio-preview-empty-title">还没有背面</p>
        <p class="studio-preview-empty-text">填写「签发机关」与「有效期限」后即可预览并导出背面。</p>
      </div>
    </div>

    <p class="studio-preview-hint">
      左侧编辑即时预览 · 所有资料均为随机虚构，仅用于功能测试 · 导出 1800 × 1200 JPEG
    </p>

    <!-- 导出用的离屏卡面：只在截图瞬间挂载，避免常驻两份大尺寸 DOM -->
    <div class="studio-preview-offscreen" aria-hidden="true">
      <div v-if="exportSide" ref="exportRef">
        <IdCard
          v-if="info"
          :side="exportSide"
          :info="info"
          :head-src="headSrc"
          :watermark="watermark"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.studio-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 10px;
}

.studio-preview-head {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.studio-preview-tabs {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: $color-surface-muted;
  border: 1px solid $color-border;
  border-radius: 10px;
}

.studio-preview-tab {
  height: 28px;
  padding: 0 16px;
  font-size: 11.5px;
  color: $color-text-secondary;
  border-radius: 7px;
  transition: color $transition-fast, background-color $transition-fast,
    box-shadow $transition-fast;

  &:hover {
    color: $color-text-primary;
  }
}

.studio-preview-tab-active {
  font-weight: 500;
  color: $color-text-primary;
  background: $color-surface;
  box-shadow: 0 2px 6px -2px rgba(20, 24, 33, 0.22);

  &:hover {
    color: $color-text-primary;
  }
}

.studio-preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.studio-preview-watermark {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: $color-text-tertiary;
  cursor: pointer;
  transition: color $transition-fast;

  &:hover {
    color: $color-text-secondary;
  }

  input {
    width: 13px;
    height: 13px;
    cursor: pointer;
    accent-color: $color-accent;
  }
}

.studio-preview-divider {
  width: 1px;
  height: 16px;
  background: $color-border;
}

.studio-preview-button {
  height: 30px;
  padding: 0 13px;
  font-size: 11.5px;
  color: $color-text-secondary;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  transition: color $transition-fast, border-color $transition-fast, filter $transition-fast;

  &:hover:not(:disabled) {
    color: $color-text-primary;
    border-color: $color-border-strong;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.studio-preview-button-primary {
  font-weight: 500;
  color: $color-accent-text;
  background: linear-gradient(135deg, $color-accent-soft, $color-accent);
  border-color: transparent;
  box-shadow: 0 10px 20px -14px $color-accent-glow;

  &:hover:not(:disabled) {
    color: $color-accent-text;
    filter: brightness(1.04);
  }
}

// 卡面展示区：柔光 + 点阵底座，卡片按可用高度等比缩放并居中
.studio-preview-board {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  max-width: 980px;
  min-height: 0;
  margin: 0 auto;
  padding: 20px;
  overflow: hidden;
  background:
    radial-gradient(120% 76% at 50% 4%, $color-board-glow, transparent 62%),
    linear-gradient(180deg, $color-surface, $color-surface-muted 68%);
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);

  // 点阵纹理，弱化大面积留白的空旷感
  &::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    content: '';
    background-image: radial-gradient($color-board-dot 1.1px, transparent 1.1px);
    background-size: 20px 20px;
    mask-image: radial-gradient(82% 74% at 50% 46%, #000 0%, transparent 82%);
  }
}

.studio-preview-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 100%;
}

.studio-preview-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 2px;
}

.studio-preview-card-label {
  font-size: 11px;
  letter-spacing: 0.2px;
  color: $color-text-secondary;
}

.studio-preview-card-sub {
  font-size: 8.5px;
  letter-spacing: 1.6px;
  color: $color-text-tertiary;
}

.studio-preview-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  box-shadow:
    0 0 0 1px rgba(20, 24, 33, 0.06),
    0 26px 44px -28px rgba(16, 24, 40, 0.6);
}

.studio-preview-scaler {
  position: absolute;
  top: 0;
  left: 0;
  width: 3600px;
  height: 2400px;
  transform-origin: top left;
}

.studio-preview-empty {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 420px;
  min-height: 160px;
  text-align: center;
  border: 1px dashed $color-border-strong;
  border-radius: $radius-md;
}

.studio-preview-empty-title {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.studio-preview-empty-text {
  max-width: 260px;
  font-size: 11px;
  line-height: 1.7;
  color: $color-text-tertiary;
}

.studio-preview-blocked {
  flex: 0 0 auto;
  padding: 6px 10px;
  font-size: 11px;
  color: $color-danger;
  background: $color-danger-bg;
  border-radius: $radius-sm;
}

.studio-preview-hint {
  flex: 0 0 auto;
  font-size: 10.5px;
  letter-spacing: 0.2px;
  color: $color-text-tertiary;
  text-align: center;
}

.studio-preview-offscreen {
  position: fixed;
  top: 0;
  left: -100000px;
  width: 3600px;
  height: 2400px;
  pointer-events: none;
}

@media (max-width: 1000px) {
  .studio-preview {
    height: auto;
  }

  .studio-preview-board {
    min-height: 320px;
    padding: 14px;
  }
}
</style>
