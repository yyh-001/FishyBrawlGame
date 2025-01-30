<template>
  <div 
    class="flex items-center justify-between w-full cursor-pointer hover:bg-white/5"
    @click="$emit('click', friend)"
  >
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <span class="text-sm font-medium text-white">
          {{ friend.username[0]?.toUpperCase() }}
        </span>
      </div>
      <div>
        <p class="text-sm font-medium text-white">{{ friend.username }}</p>
        <p class="text-xs text-white/60">Rating: {{ friend.rating }}</p>
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <el-tag 
        :type="getStatusType(friend.status)"
        size="small"
        class="ml-2"
      >
        {{ getStatusText(friend.status) }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
defineProps({
  friend: {
    type: Object,
    required: true
  }
})

defineEmits(['remove', 'click'])

const getStatusType = (status) => {
  return status === 'online' ? 'success' : 'info'
}

const getStatusText = (status) => {
  return status === 'online' ? '在线' : '离线'
}
</script> 