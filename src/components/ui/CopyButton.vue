<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { copyText } from '@/utils/clipboard'

const props = defineProps<{
  /** 要复制的文本 */
  text: string
  /** 无障碍描述，默认「复制」 */
  label?: string
}>()

/** 复制成功后短暂显示对勾 */
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

/** 点击复制 */
async function handleCopy(): Promise<void> {
  const ok = await copyText(props.text)
  if (!ok) return
  copied.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    copied.value = false
  }, 1400)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <button
    type="button"
    class="copy-button"
    :class="{ 'copy-button-done': copied }"
    :aria-label="copied ? '已复制' : label ?? '复制'"
    :title="copied ? '已复制' : label ?? '复制'"
    @click.stop="handleCopy"
  >
    <svg v-if="!copied" class="copy-button-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5.2" y="5.2" width="8" height="8" rx="1.6" />
      <path d="M10.8 3.4V3.2A1.6 1.6 0 0 0 9.2 1.6H3.4A1.6 1.6 0 0 0 1.8 3.2v5.8a1.6 1.6 0 0 0 1.6 1.6h.2" />
    </svg>
    <svg v-else class="copy-button-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.6 6.2 11.8 13 5" />
    </svg>
  </button>
</template>

<style scoped lang="scss">
.copy-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: $color-text-tertiary;
  border-radius: 8px;
  transition: color $transition-fast, background-color $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-surface-muted;
  }
}

.copy-button-done {
  color: $color-accent;

  &:hover {
    color: $color-accent;
  }
}

.copy-button-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
