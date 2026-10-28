<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import headMan from '@/assets/card/head-man.webp'
import headWoman from '@/assets/card/head-woman.webp'
import AppHeader from '@/components/AppHeader.vue'
import StudioForm from '@/components/StudioForm.vue'
import StudioPreview from '@/components/StudioPreview.vue'
import { useTheme } from '@/composables/useTheme'
import type { IdCardInfo, IdFormState } from '@/types'
import { preloadCardFonts } from '@/utils/exportCard'
import { createRandomInfo } from '@/utils/fakeInfo'
import { extractIdBasics, parseIdNumber } from '@/utils/idNumber'
import { formatCardDate } from '@/utils/random'

const { isDark, toggleTheme } = useTheme()

/** 上次上传照片的会话缓存键，同一个标签页刷新后可恢复 */
const PHOTO_STORAGE_KEY = 'idimg-photo'
/** 照片体积上限 5 MB */
const PHOTO_SIZE_LIMIT = 5 * 1024 * 1024
/** 超过该体积不写入 sessionStorage，避免超出浏览器配额 */
const PHOTO_CACHE_LIMIT = 2 * 1024 * 1024
/** 号码不完整时卡面使用的占位出生日期 */
const FALLBACK_BIRTH = new Date(1990, 0, 1)

/** 表单数据 */
const form = reactive<IdFormState>({
  name: '',
  nation: '',
  phone: '',
  idNumber: '',
  address: '',
  authority: '',
  validStart: '',
  validEnd: '',
})

/** 用户上传的照片（dataURL），为空时使用预设真人头像 */
const photoUrl = ref('')
/** 照片相关的错误提示 */
const photoError = ref('')
/** 测试水印开关 */
const watermark = ref(true)

/** 宽松解析身份证号，保证边输入边预览不中断 */
const basics = computed(() => extractIdBasics(form.idNumber))

/** 由号码推导的性别，号码不合法时为空 */
const gender = computed(() => basics.value?.gender ?? '')

/** 由号码推导的出生日期，格式 yyyy.mm.dd */
const birthText = computed(() => (basics.value ? formatCardDate(basics.value.birth) : ''))

/** 卡面渲染用信息 */
const cardInfo = computed<IdCardInfo>(() => ({
  name: form.name.trim(),
  gender: basics.value?.gender ?? '男',
  nation: form.nation.trim(),
  birth: basics.value?.birth ?? FALLBACK_BIRTH,
  address: form.address.trim(),
  idNumber: form.idNumber.trim().toUpperCase(),
  authority: form.authority.trim(),
  validStart: form.validStart.trim(),
  validEnd: form.validEnd.trim() || '长期',
}))

/** 卡面头像：优先使用上传照片，否则按推导出的性别取预设真人头像 */
const headSrc = computed(() => {
  if (photoUrl.value) return photoUrl.value
  return gender.value === '女' ? headWoman : headMan
})

/** 是否具备生成背面的条件 */
const hasBack = computed(() => Boolean(form.authority.trim() && form.validStart.trim()))

/** 统计汉字数量 */
function countHanzi(value: string): number {
  return Array.from(value).filter((char) => /[\u4e00-\u9fa5]/.test(char)).length
}

/** 校验有效期限格式：YYYY.MM.DD */
function isCardDate(value: string): boolean {
  return /^\d{4}\.\d{2}\.\d{2}$/.test(value)
}

/** 字段级校验提示 */
const errors = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {}
  const authority = form.authority.trim()
  const validStart = form.validStart.trim()
  const validEnd = form.validEnd.trim()

  if (countHanzi(form.name) < 2) result.name = '姓名至少 2 个汉字'
  if (!form.nation.trim()) result.nation = '请填写民族'
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) result.phone = '手机号应为 1 开头的 11 位数字'
  if (!parseIdNumber(form.idNumber)) result.idNumber = '号码位数、出生日期或校验码有误'
  if (!form.address.trim()) result.address = '请填写住址'

  if (authority && countHanzi(authority) < 6) result.authority = '签发机关至少 6 个汉字，或留空'
  if (authority && (!validStart || !validEnd)) result.validStart = '填写机关后需补全有效期限'
  if (validStart && !isCardDate(validStart)) result.validStart = '格式应为 2019.01.17'
  if (validEnd && validEnd !== '长期' && !isCardDate(validEnd)) result.validEnd = '格式应为 2029.01.17 或「长期」'
  if (photoError.value) result.photo = photoError.value

  return result
})

/** 校验通过才允许导出 */
const canExport = computed(() => Object.keys(errors.value).length === 0)

/** 换一组随机资料 */
function fillRandom(): void {
  const profile = createRandomInfo()
  Object.assign(form, {
    name: profile.name,
    nation: profile.nation,
    phone: profile.phone,
    idNumber: profile.idNumber,
    address: profile.address,
    authority: profile.authority,
    validStart: profile.validStart,
    validEnd: profile.validEnd,
  })
  photoError.value = ''
}

/** 读取图片为 dataURL，便于写入 sessionStorage 后刷新恢复 */
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** 上传照片：转成 dataURL 供卡面头像使用 */
async function handleUpload(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    photoError.value = '请选择图片格式的文件'
    return
  }
  if (file.size > PHOTO_SIZE_LIMIT) {
    photoError.value = '图片超过 5 MB，请压缩后再上传'
    return
  }

  try {
    photoUrl.value = await readAsDataURL(file)
  } catch {
    photoError.value = '图片读取失败，请更换一张图片重试'
    return
  }

  try {
    if (file.size <= PHOTO_CACHE_LIMIT) {
      sessionStorage.setItem(PHOTO_STORAGE_KEY, photoUrl.value)
    } else {
      sessionStorage.removeItem(PHOTO_STORAGE_KEY)
    }
  } catch {
    // 存储空间不足时放弃缓存，不影响本次使用
    sessionStorage.removeItem(PHOTO_STORAGE_KEY)
  }

  photoError.value = ''
}

/** 移除已上传照片，回到预设真人头像 */
function handleRemovePhoto(): void {
  photoUrl.value = ''
  photoError.value = ''
  sessionStorage.removeItem(PHOTO_STORAGE_KEY)
}

onMounted(() => {
  // 首次进入自动填充一整套随机资料，右侧立即出预览
  fillRandom()

  // 恢复上次上传的照片（同一个会话内刷新不丢失）
  const cached = sessionStorage.getItem(PHOTO_STORAGE_KEY)
  if (cached) photoUrl.value = cached

  // 卡面字体体积较大，进入页面就预热，避免首帧闪烁
  void preloadCardFonts()
})
</script>

<template>
  <div class="app">
    <div class="app-backdrop"></div>

    <div class="app-shell">
      <AppHeader :is-dark="isDark" @toggle-theme="toggleTheme" />

      <main class="app-main">
        <StudioForm
          :form="form"
          :photo-url="photoUrl"
          :gender="gender"
          :birth-text="birthText"
          :errors="errors"
          @random="fillRandom"
          @upload="handleUpload"
          @remove-photo="handleRemovePhoto"
        />

        <StudioPreview
          v-model:watermark="watermark"
          :info="cardInfo"
          :head-src="headSrc"
          :has-back="hasBack"
          :can-export="canExport"
        />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app {
  position: relative;
  display: flex;
  justify-content: center;
  height: 100vh;
  padding: 0 $spacing-md;
  overflow: hidden;
}

.app-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(680px 420px at 10% -12%, $color-glow-one, transparent 66%),
    radial-gradient(720px 460px at 94% -6%, $color-glow-two, transparent 70%);
}

.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1280px;
  min-height: 0;
}

.app-main {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: 384px minmax(0, 1fr);
  gap: $spacing-md;
  min-height: 0;
  padding-bottom: $spacing-md;
}

// 窄屏改为上下堆叠，允许页面滚动
@media (max-width: 1000px) {
  .app {
    height: auto;
    min-height: 100vh;
    padding: 0 $spacing-sm;
    overflow: visible;
  }

  .app-main {
    grid-template-columns: minmax(0, 1fr);
    gap: $spacing-sm;
    padding-bottom: $spacing-lg;
  }
}
</style>
