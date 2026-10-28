<script setup lang="ts">
import { computed } from 'vue'
import backBg from '@/assets/card/id-back.webp'
import frontBg from '@/assets/card/id-front.webp'
import noiseUrl from '@/assets/card/font-noise.webp'
import type { CardSide, IdCardInfo } from '@/types'
import HeadPhoto from './HeadPhoto.vue'

const props = defineProps<{
  /** 正反面 */
  side: CardSide
  /** 证件信息 */
  info: IdCardInfo
  /** 头像地址：预设抠图或用户上传的照片 */
  headSrc: string
  /** 是否叠加测试水印 */
  watermark?: boolean
}>()

/** 文字填充纹理：噪点图配合 background-clip: text 模拟油墨颗粒 */
const noiseStyle = { backgroundImage: `url("${noiseUrl}")` }

/** 底图：木纹背景 + 卡面印刷图层，尺寸 3600 × 2400 */
const backgroundUrl = computed(() => (props.side === 'front' ? frontBg : backBg))

/** 姓名两字时加大字距，避免整体偏窄 */
const nameLetterSpacing = computed(() => (Array.from(props.info.name).length === 2 ? '80px' : '2px'))

/** 出身年 / 月 / 日，月日不补零（与卡面版式一致） */
const birthParts = computed(() => {
  const year = String(props.info.birth.getFullYear())
  const month = String(props.info.birth.getMonth() + 1)
  const day = String(props.info.birth.getDate())
  return { year, month, day }
})

/** 住址片段：数字、字母、符号改用拉丁字体，其余用中文印刷体 */
interface AddressSegment {
  text: string
  latin: boolean
  hyphen: boolean
}

const LATIN_PATTERN = /[\x20-\x7e\u3000-\u303F\uFF00-\uFFEF]/

const addressSegments = computed<AddressSegment[]>(() => {
  const segments: AddressSegment[] = []
  const chunks = props.info.address.split(/([\x20-\x7e\u3000-\u303F\uFF00-\uFFEF]+)/g)

  for (const chunk of chunks) {
    if (!chunk) continue
    if (!LATIN_PATTERN.test(chunk)) {
      segments.push({ text: chunk, latin: false, hyphen: false })
      continue
    }
    // 连字符单独成段，使用专门的间距样式
    for (const piece of chunk.split(/(-)/)) {
      if (!piece) continue
      segments.push({ text: piece, latin: true, hyphen: piece === '-' })
    }
  }
  return segments
})
</script>

<template>
  <div class="id-card" :class="side === 'front' ? 'id-card-front' : 'id-card-back'">
    <template v-if="side === 'front'">
      <div class="id-card-text-name">
        <p :style="{ ...noiseStyle, letterSpacing: nameLetterSpacing }">{{ info.name }}</p>
      </div>

      <div class="id-card-text-gender">
        <p :style="noiseStyle">{{ info.gender }}</p>
        <p :style="noiseStyle">{{ info.nation }}</p>
      </div>

      <div class="id-card-text-born">
        <p :style="noiseStyle">{{ birthParts.year }}</p>
        <div class="id-card-text-born-month">
          <p :style="noiseStyle">{{ birthParts.month }}</p>
        </div>
        <div class="id-card-text-born-month">
          <p :style="noiseStyle">{{ birthParts.day }}</p>
        </div>
      </div>

      <div class="id-card-text-address">
        <span :style="noiseStyle">
          <template v-for="(segment, index) in addressSegments" :key="index">
            <span
              v-if="segment.latin"
              :class="['latin', { hyphen: segment.hyphen }]"
            >{{ segment.text }}</span>
            <template v-else>{{ segment.text }}</template>
          </template>
        </span>
      </div>

      <div class="id-card-text-number">
        <p :style="noiseStyle">{{ info.idNumber }}</p>
      </div>

      <div class="id-card-head">
        <div class="id-card-head-img">
          <HeadPhoto class="id-card-head-canvas" :src="headSrc" />
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="info.authority" class="id-card-text-office">
        <p :style="noiseStyle">{{ info.authority }}</p>
      </div>

      <div v-if="info.validStart" class="id-card-text-period">
        <p class="id-card-text-period-value" :style="noiseStyle">{{ info.validStart }}</p>
        <p class="id-card-text-period-hyphen" :style="noiseStyle">-</p>
        <p
          :class="info.validEnd === '长期' ? 'id-card-text-period-long' : 'id-card-text-period-value'"
          :style="noiseStyle"
        >
          {{ info.validEnd }}
        </p>
      </div>
    </template>

    <div class="id-card-bg" :style="{ backgroundImage: `url('${backgroundUrl}')` }"></div>

    <div v-if="watermark" class="id-card-watermark">仅供测试 · 非真实证件</div>
  </div>
</template>
