<script setup lang="ts">
// 顶部栏：品牌标识 + 标题 + 主题切换
defineProps<{
  /** 当前是否深色模式 */
  isDark: boolean
}>()

const emit = defineEmits<{
  (event: 'toggleTheme'): void
}>()
</script>

<template>
  <header class="app-topbar">
    <div class="app-topbar-brand">
      <span class="app-topbar-badge">ID</span>
      <div class="app-topbar-text">
        <h1 class="app-topbar-title">身份证图片生成器</h1>
        <p class="app-topbar-sub">CHINESE ID CARD IMAGE GENERATOR</p>
      </div>
    </div>

    <div class="app-topbar-actions">
      <span class="app-topbar-note">随机虚构数据 · 仅供测试</span>
      <button type="button" class="app-topbar-theme" @click="emit('toggleTheme')">
        {{ isDark ? '浅色模式' : '深色模式' }}
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-topbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  height: 60px;
}

.app-topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-topbar-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: $color-accent-text;
  background: linear-gradient(140deg, $color-accent-soft, $color-accent);
  border-radius: 10px;
  box-shadow: 0 8px 16px -10px $color-accent-glow;
}

.app-topbar-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.app-topbar-title {
  font-size: $font-size-base;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: $color-text-primary;
}

.app-topbar-sub {
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: 1.6px;
  color: $color-text-tertiary;
}

.app-topbar-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.app-topbar-note {
  font-size: 11px;
  letter-spacing: 0.2px;
  color: $color-text-tertiary;
}

.app-topbar-theme {
  height: 28px;
  padding: 0 12px;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-pill;
  transition: color $transition-fast, border-color $transition-fast, background-color $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-surface-muted;
    border-color: $color-border-strong;
  }
}

@media (max-width: 640px) {
  .app-topbar-note {
    display: none;
  }
}
</style>
