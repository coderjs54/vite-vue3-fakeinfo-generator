// ============================================================
// 主题切换：亮色 / 深色，跟随系统偏好并持久化到 localStorage
// ============================================================

import { ref, watch } from 'vue'

const THEME_STORAGE_KEY = 'idimg-theme'

/** 全局唯一的主题状态，多个组件共享 */
const isDark = ref(false)
let initialized = false

/** 初始化主题：优先读取本地记录，否则跟随系统设置 */
function initTheme(): void {
  if (initialized) return
  initialized = true

  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  isDark.value = stored
    ? stored === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches

  watch(
    isDark,
    (dark) => {
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light')
    },
    { immediate: true },
  )
}

export function useTheme() {
  initTheme()

  /** 在亮色与深色模式之间切换 */
  function toggleTheme(): void {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
}
