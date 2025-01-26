<template>
  <div class="space-y-4">
    <template v-if="battles.length > 0">
      <div 
        v-for="battle in battles" 
        :key="battle.id"
        class="bg-bg-secondary/50 rounded-xl p-4 flex items-center justify-between hover:bg-bg-secondary transition-colors"
      >
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <el-icon class="text-2xl text-primary">
              <component :is="battle.result === 'win' ? 'Trophy' : 'CircleClose'" />
            </el-icon>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-text-primary font-medium">
                {{ battle.opponent }}
              </span>
              <span 
                class="text-sm"
                :class="battle.result === 'win' ? 'text-success' : 'text-danger'"
              >
                {{ battle.result === 'win' ? '胜利' : '失败' }}
              </span>
            </div>
            <p class="text-sm text-text-secondary">
              {{ formatDate(battle.date) }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-text-primary font-medium">
            {{ battle.result === 'win' ? '+' : '-' }}{{ battle.ratingChange }}
          </p>
          <p class="text-sm text-text-secondary">
            Rating {{ battle.rating }}
          </p>
        </div>
      </div>
    </template>
    <div v-else class="text-center text-text-secondary py-8">
      暂无对战记录
    </div>
  </div>
</template>

<script setup>
import { Trophy, CircleClose } from '@element-plus/icons-vue'

const props = defineProps({
  battles: {
    type: Array,
    default: () => []
  }
})

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })
}
</script> 