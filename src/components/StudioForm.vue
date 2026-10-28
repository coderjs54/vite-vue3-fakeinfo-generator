<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import type { IdFormState } from '@/types'
import { copyText } from '@/utils/clipboard'

const props = defineProps<{
  /** 父级的 reactive 表单对象，读取/修改字段会实时反映到右侧预览 */
  form: IdFormState
  /** 已上传照片的本地预览地址 */
  photoUrl: string
  /** 由身份证号推导的性别 */
  gender: string
  /** 由身份证号推导的出生日期，格式 yyyy.mm.dd */
  birthText: string
  /** 字段级校验提示 */
  errors: Record<string, string>
}>()

/** 直接用父级传入的响应式对象，避免整表 v-model 带来的额外拷贝 */
const form = props.form

const emit = defineEmits<{
  /** 换一组随机资料 */
  (event: 'random'): void
  /** 上传照片 */
  (event: 'upload', file: File): void
  /** 移除照片 */
  (event: 'removePhoto'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
/** 「复制全部」后的短暂反馈 */
const copiedAll = ref(false)
/** 表单区是否还有未展示的内容（用于底部渐隐提示，滚动条本身是隐藏的） */
const hasHiddenContent = ref(false)

let bodyObserver: ResizeObserver | null = null

/** 内容超出且尚未滚到底时，才显示底部渐隐 */
function checkScrollable(): void {
  const el = bodyRef.value
  if (!el) return
  const overflow = el.scrollHeight - el.clientHeight
  hasHiddenContent.value = overflow > 4 && el.scrollTop < overflow - 4
}

onMounted(() => {
  checkScrollable()
  if (bodyRef.value) {
    bodyObserver = new ResizeObserver(checkScrollable)
    bodyObserver.observe(bodyRef.value)
  }
})

onBeforeUnmount(() => {
  bodyObserver?.disconnect()
  bodyObserver = null
})

// 校验提示出现/消失会改变内容高度，需要重新判断
watch(
  () => props.errors,
  () => {
    void nextTick(checkScrollable)
  },
  { deep: true },
)

/** 打开系统文件选择框 */
function triggerUpload(): void {
  fileInputRef.value?.click()
}

/** 读取用户选择的图片并交给父组件 */
function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('upload', file)
  // 清空 value，保证再次选择同一张图片也能触发 change
  input.value = ''
}

/** 把当前全部资料拼成多行文本，一次性复制 */
async function handleCopyAll(): Promise<void> {
  const lines = [
    `姓名：${form.name}`,
    `民族：${form.nation}`,
    `性别：${props.gender}`,
    `出生日期：${props.birthText}`,
    `手机号：${form.phone}`,
    `公民身份号码：${form.idNumber}`,
    `住址：${form.address}`,
    `签发机关：${form.authority}`,
    `有效期限：${form.validStart} - ${form.validEnd}`,
  ]
  const ok = await copyText(lines.join('\n'))
  if (!ok) return
  copiedAll.value = true
  setTimeout(() => {
    copiedAll.value = false
  }, 1600)
}
</script>

<template>
  <aside class="studio-form">
    <header class="studio-form-head">
      <h2 class="studio-form-title">
        <span class="studio-form-title-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M8 1.8v2.1M8 12.1v2.1M1.8 8h2.1M12.1 8h2.1M3.6 3.6l1.5 1.5M10.9 10.9l1.5 1.5M12.4 3.6l-1.5 1.5M5.1 10.9l-1.5 1.5" />
          </svg>
        </span>
        随机生成资料
      </h2>
      <button type="button" class="studio-form-shuffle" @click="emit('random')">
        <svg class="studio-form-shuffle-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M13.4 3.2a6.6 6.6 0 1 0 1.2 5.4" />
          <path d="M13.6 1.2v2.6h-2.6" />
        </svg>
        换一组灵感
      </button>
    </header>

    <div
      ref="bodyRef"
      class="studio-form-body"
      :class="{ 'studio-form-body-fade': hasHiddenContent }"
      @scroll.passive="checkScrollable"
    >
      <!-- 基本信息 -->
      <section class="studio-form-section">
        <div class="studio-form-section-head">
          <h3 class="studio-form-section-title">基本信息</h3>
          <span class="studio-form-section-sub">BASIC INFORMATION</span>
          <button
            type="button"
            class="studio-form-copy-all"
            :class="{ 'studio-form-copy-all-done': copiedAll }"
            @click="handleCopyAll"
          >
            {{ copiedAll ? '已复制全部' : '复制全部' }}
          </button>
        </div>

        <div class="studio-form-grid">
          <div class="studio-form-field">
            <span class="studio-form-label">姓名</span>
            <div class="studio-form-control">
              <input
                v-model="form.name"
                class="studio-form-input"
                type="text"
                maxlength="8"
                placeholder="请输入姓名"
                aria-label="姓名"
              />
              <CopyButton :text="form.name" label="复制姓名" />
            </div>
            <p v-if="errors.name" class="studio-form-error">{{ errors.name }}</p>
          </div>

          <div class="studio-form-field">
            <span class="studio-form-label">民族</span>
            <div class="studio-form-control">
              <input
                v-model="form.nation"
                class="studio-form-input"
                type="text"
                maxlength="6"
                placeholder="汉"
                aria-label="民族"
              />
              <CopyButton :text="form.nation" label="复制民族" />
            </div>
            <p v-if="errors.nation" class="studio-form-error">{{ errors.nation }}</p>
          </div>

          <div class="studio-form-field">
            <span class="studio-form-label">性别</span>
            <div class="studio-form-control">
              <input
                class="studio-form-input studio-form-input-readonly"
                type="text"
                :value="gender || '——'"
                readonly
                tabindex="-1"
                aria-label="性别"
              />
              <CopyButton :text="gender" label="复制性别" />
            </div>
          </div>

          <div class="studio-form-field">
            <span class="studio-form-label">出生日期</span>
            <div class="studio-form-control">
              <input
                class="studio-form-input studio-form-input-readonly"
                type="text"
                :value="birthText || '——'"
                readonly
                tabindex="-1"
                aria-label="出生日期"
              />
              <CopyButton :text="birthText" label="复制出生日期" />
            </div>
          </div>

          <div class="studio-form-field studio-form-field-wide">
            <span class="studio-form-label">手机号</span>
            <div class="studio-form-control">
              <input
                v-model="form.phone"
                class="studio-form-input studio-form-input-mono"
                type="tel"
                maxlength="11"
                placeholder="11 位中国大陆手机号"
                aria-label="手机号"
              />
              <CopyButton :text="form.phone" label="复制手机号" />
            </div>
            <p v-if="errors.phone" class="studio-form-error">{{ errors.phone }}</p>
          </div>

          <div class="studio-form-field studio-form-field-wide">
            <div class="studio-form-label-row">
              <span class="studio-form-label">样例号码</span>
              <span class="studio-form-badge">虚拟号码</span>
            </div>
            <div class="studio-form-control">
              <input
                v-model="form.idNumber"
                class="studio-form-input studio-form-input-mono"
                type="text"
                maxlength="18"
                placeholder="18 位公民身份号码"
                aria-label="公民身份号码"
              />
              <CopyButton :text="form.idNumber" label="复制号码" />
            </div>
            <p v-if="errors.idNumber" class="studio-form-error">{{ errors.idNumber }}</p>
            <p v-else class="studio-form-hint">校验位合法，但不对应任何真实个人。</p>
          </div>

          <div class="studio-form-field studio-form-field-wide">
            <span class="studio-form-label">住址</span>
            <div class="studio-form-control studio-form-control-top">
              <textarea
                v-model="form.address"
                class="studio-form-input studio-form-textarea"
                rows="2"
                placeholder="省 / 市 / 区县 / 街道门牌"
                aria-label="住址"
              ></textarea>
              <CopyButton :text="form.address" label="复制住址" />
            </div>
            <p v-if="errors.address" class="studio-form-error">{{ errors.address }}</p>
          </div>
        </div>
      </section>

      <!-- 人像照片 -->
      <section class="studio-form-section">
        <div class="studio-form-section-head">
          <h3 class="studio-form-section-title">人像照片</h3>
          <span class="studio-form-section-sub">PORTRAIT</span>
        </div>

        <div class="studio-form-upload-wrap">
          <button type="button" class="studio-form-upload" @click="triggerUpload">
            <span v-if="!photoUrl" class="studio-form-upload-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.6" />
                <path d="M3.4 15.4l3.9-3.7 3.6 3.4 3.3-3 5.4 5" />
                <circle cx="15.6" cy="9.2" r="1.6" />
              </svg>
            </span>
            <img v-else class="studio-form-upload-thumb" :src="photoUrl" alt="已上传照片" />
            <span class="studio-form-upload-text">
              <strong class="studio-form-upload-title">
                {{ photoUrl ? '点击更换人像照片' : '点击上传人像照片' }}
              </strong>
              <em class="studio-form-upload-hint">JPG、PNG、WebP，最大 5 MB</em>
            </span>
            <span class="studio-form-upload-arrow" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </span>
          </button>
          <button
            v-if="photoUrl"
            type="button"
            class="studio-form-upload-remove"
            @click="emit('removePhoto')"
          >
            恢复预设头像
          </button>
        </div>

        <input
          ref="fileInputRef"
          class="studio-form-file"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />
        <p v-if="errors.photo" class="studio-form-error">{{ errors.photo }}</p>
      </section>

      <!-- 签发信息 -->
      <section class="studio-form-section">
        <div class="studio-form-section-head">
          <h3 class="studio-form-section-title">签发信息</h3>
          <span class="studio-form-section-sub">ISSUANCE DETAILS</span>
        </div>

        <div class="studio-form-grid">
          <div class="studio-form-field studio-form-field-wide">
            <span class="studio-form-label">签发机关</span>
            <div class="studio-form-control">
              <input
                v-model="form.authority"
                class="studio-form-input"
                type="text"
                placeholder="如：杭州市公安局西湖分局（留空则无背面）"
                aria-label="签发机关"
              />
              <CopyButton :text="form.authority" label="复制签发机关" />
            </div>
            <p v-if="errors.authority" class="studio-form-error">{{ errors.authority }}</p>
          </div>

          <div class="studio-form-field">
            <span class="studio-form-label">有效期起始</span>
            <div class="studio-form-control">
              <input
                v-model="form.validStart"
                class="studio-form-input studio-form-input-mono"
                type="text"
                maxlength="10"
                placeholder="2019.01.17"
                aria-label="有效期起始"
              />
              <CopyButton :text="form.validStart" label="复制有效期起始" />
            </div>
            <p v-if="errors.validStart" class="studio-form-error">{{ errors.validStart }}</p>
          </div>

          <div class="studio-form-field">
            <span class="studio-form-label">有效期结束</span>
            <div class="studio-form-control">
              <input
                v-model="form.validEnd"
                class="studio-form-input studio-form-input-mono"
                type="text"
                maxlength="10"
                placeholder="2029.01.17 或 长期"
                aria-label="有效期结束"
              />
              <CopyButton :text="form.validEnd" label="复制有效期结束" />
            </div>
            <p v-if="errors.validEnd" class="studio-form-error">{{ errors.validEnd }}</p>
          </div>
        </div>
      </section>

      <p class="studio-form-tip">
        提示：每个字段右侧图标可一键复制；右侧卡面会随左侧修改实时更新。
      </p>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.studio-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  box-shadow: 0 20px 40px -32px rgba(20, 24, 33, 0.45);
  transition: background-color $transition-base, border-color $transition-base;
}

.studio-form-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: 12px $spacing-md;
  border-bottom: 1px solid $color-border;
}

.studio-form-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: $font-size-sm;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: $color-text-primary;
}

.studio-form-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: $color-accent-hover;
  background: $color-accent-soft;
  border-radius: 7px;

  svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
  }
}

.studio-form-shuffle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  font-size: 11px;
  color: $color-text-secondary;
  background: $color-surface-muted;
  border-radius: $radius-pill;
  transition: color $transition-fast, background-color $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-accent-soft;
  }
}

.studio-form-shuffle-icon {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

// 表单主体：占满剩余高度，内容超出时可在内部滚动（不显示滚动条）
.studio-form-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 14px 16px 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
  // 隐藏滚动条：既不占宽度，也不会在视觉上破坏整体版面
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

// 内容超出时底部渐隐，提示还可以继续向下滚动
.studio-form-body-fade {
  mask-image: linear-gradient(to bottom, #000 calc(100% - 20px), transparent);
}

.studio-form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  & + & {
    padding-top: 12px;
    border-top: 1px solid $color-border;
  }
}

.studio-form-section-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.studio-form-section-title {
  font-size: $font-size-xs;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: $color-text-primary;
}

.studio-form-section-sub {
  flex: 1 1 auto;
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: 1.4px;
  color: $color-text-tertiary;
  text-transform: uppercase;
}

.studio-form-copy-all {
  flex: 0 0 auto;
  font-size: 10.5px;
  color: $color-text-tertiary;
  transition: color $transition-fast;

  &:hover {
    color: $color-accent-hover;
  }
}

.studio-form-copy-all-done {
  color: $color-accent;
}

.studio-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 10px;
}

.studio-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.studio-form-field-wide {
  grid-column: 1 / -1;
}

.studio-form-label {
  font-size: 11px;
  line-height: 1.4;
  color: $color-text-secondary;
}

.studio-form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.studio-form-control {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.studio-form-control-top {
  align-items: flex-start;
}

.studio-form-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 9px;
  font-size: $font-size-xs;
  color: $color-text-primary;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  outline: none;
  transition: border-color $transition-fast, box-shadow $transition-fast,
    background-color $transition-fast;

  &::placeholder {
    color: $color-text-tertiary;
  }

  &:hover {
    border-color: $color-border-strong;
  }

  &:focus {
    background: $color-surface;
    border-color: $color-accent;
    box-shadow: 0 0 0 3px $color-accent-glow;
  }
}

.studio-form-input-mono {
  font-family: $font-family-mono;
  font-size: 11.5px;
  letter-spacing: 0.3px;
}

.studio-form-input-readonly {
  color: $color-text-secondary;
  background: $color-surface-muted;
  border-color: transparent;
  cursor: default;

  &:hover {
    border-color: transparent;
  }
}

.studio-form-textarea {
  height: auto;
  min-height: 58px;
  padding: 7px 9px;
  line-height: 1.55;
  resize: none;
}

.studio-form-badge {
  flex: 0 0 auto;
  padding: 1px 7px;
  font-size: 9.5px;
  line-height: 1.6;
  color: $color-accent-hover;
  background: $color-accent-soft;
  border-radius: $radius-pill;
}

.studio-form-hint {
  font-size: 10.5px;
  line-height: 1.6;
  color: $color-text-tertiary;
}

.studio-form-error {
  font-size: 10.5px;
  line-height: 1.6;
  color: $color-danger;
}

.studio-form-upload-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.studio-form-upload {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  text-align: left;
  background: $color-surface-muted;
  border: 1px dashed $color-border-strong;
  border-radius: $radius-md;
  transition: border-color $transition-fast, background-color $transition-fast;

  &:hover {
    background: $color-accent-soft;
    border-color: $color-accent;
  }
}

.studio-form-upload-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: $color-text-tertiary;
  background: $color-surface;
  border-radius: $radius-sm;

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.studio-form-upload-thumb {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: $radius-sm;
}

.studio-form-upload-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.studio-form-upload-title {
  font-size: 11.5px;
  font-weight: 500;
  color: $color-text-primary;
}

.studio-form-upload-hint {
  font-size: 9.5px;
  font-style: normal;
  color: $color-text-tertiary;
}

.studio-form-upload-arrow {
  flex: 0 0 auto;
  color: $color-text-tertiary;

  svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.studio-form-upload-remove {
  align-self: flex-start;
  font-size: 10.5px;
  color: $color-text-tertiary;
  transition: color $transition-fast;

  &:hover {
    color: $color-danger;
  }
}

.studio-form-tip {
  padding-top: 8px;
  margin-top: auto;
  font-size: 10.5px;
  line-height: 1.7;
  color: $color-text-tertiary;
  border-top: 1px dashed $color-border;
}

.studio-form-file {
  display: none;
}

@media (max-width: 1000px) {
  .studio-form {
    height: auto;
  }

  .studio-form-body {
    overflow: visible;
  }
}

@media (max-width: 420px) {
  .studio-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
