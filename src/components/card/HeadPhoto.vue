<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { HEAD_HEIGHT, HEAD_WIDTH, renderHeadPhoto } from '@/renderer/headPhoto'

const props = defineProps<{
  /** 头像地址：预设真人头像或用户上传的照片 */
  src: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

/** 重新绘制头像（噪点 + 低多边形处理在 renderHeadPhoto 内完成） */
function paint(): void {
  const canvas = canvasRef.value
  if (!canvas || !props.src) return
  void renderHeadPhoto(canvas, props.src)
}

onMounted(paint)
watch(() => props.src, paint)
</script>

<template>
  <canvas ref="canvasRef" :width="HEAD_WIDTH" :height="HEAD_HEIGHT"></canvas>
</template>
