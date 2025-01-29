<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="friend?.username || '好友详情'"
    :width="isMobile ? '90%' : '400px'"
    class="friend-detail-dialog"
  >
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <span class="text-2xl font-medium text-white">
            {{ friend?.username?.[0]?.toUpperCase() }}
          </span>
        </div>
        <div>
          <h3 class="text-lg font-medium text-white">{{ friend?.username }}</h3>
          <p class="text-sm text-white/60">
            Rating: {{ friend?.rating }}
          </p>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white/10 rounded-lg p-3 text-center">
          <p class="text-sm text-white/60">对战次数</p>
          <p class="text-lg font-medium text-white">{{ friend?.totalGames || 0 }}</p>
        </div>
        <div class="bg-white/10 rounded-lg p-3 text-center">
          <p class="text-sm text-white/60">胜率</p>
          <p class="text-lg font-medium text-white">{{ friend?.winRate || 0 }}%</p>
        </div>
        <div class="bg-white/10 rounded-lg p-3 text-center">
          <p class="text-sm text-white/60">最高分</p>
          <p class="text-lg font-medium text-white">{{ friend?.highestRating || friend?.rating }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-2">
        <el-button 
          type="danger" 
          @click="handleRemove"
        >
          删除好友
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps({
  friend: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'remove', 'invite'])

const { isMobile } = useResponsive()

// 处理邀请对战
const handleInvite = () => {
  emit('invite', props.friend)
}

// 处理删除好友
const handleRemove = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除好友 ${props.friend.username} 吗？`,
      '删除好友',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await emit('remove', props.friend)
    // 关闭弹窗
    emit('update:visible', false)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除好友失败')
    }
  }
}
</script>

<style scoped>
:deep(.el-dialog) {
  @apply bg-gray-900/95 border border-gray-700/50;
  backdrop-filter: blur(12px);
}

:deep(.el-dialog__header) {
  @apply border-b border-gray-700/50 pb-3;
}

:deep(.el-dialog__title) {
  @apply text-white;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  @apply text-white;
}
</style> 