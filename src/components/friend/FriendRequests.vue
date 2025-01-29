<template>
  <div class="friend-requests">
    <h3 class="text-lg font-bold text-white mb-4">好友请求</h3>

    <div class="space-y-2">
      <div 
        v-for="request in friendRequests" 
        :key="request.requestId"
        class="bg-white/10 rounded-lg p-3"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span class="text-sm font-medium text-white">
                {{ request.fromUser.username[0]?.toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-white">
                {{ request.fromUser.username }}
              </p>
              <p class="text-xs text-white/60">
                {{ request.message }}
              </p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2">
          <el-button 
            type="danger" 
            size="small"
            @click="handleRequest(request.requestId, 'reject')"
            :loading="loading"
          >
            拒绝
          </el-button>
          <el-button 
            type="primary" 
            size="small"
            @click="handleRequest(request.requestId, 'accept')"
            :loading="loading"
          >
            接受
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div 
        v-if="friendRequests.length === 0" 
        class="text-center py-8 text-white/60"
      >
        暂无好友请求
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useFriendStore } from '@/stores/friend'

const friendStore = useFriendStore()
const loading = ref(false)

// 使用 store 中的 friendRequests
const friendRequests = computed(() => friendStore.friendRequests)

// 处理好友请求
const handleRequest = async (requestId, action) => {
  try {
    loading.value = true
    const response = await friendStore.handleFriendRequest(requestId, action)
    
    if (response.success) {
      // 更新好友列表和请求列表
      await Promise.all([
        friendStore.getFriends(),
        friendStore.getFriendRequests()
      ])
      
      ElMessage.success(
        action === 'accept' 
          ? '已接受好友请求' 
          : '已拒绝好友请求'
      )
    }
  } catch (error) {
    console.error('处理好友请求失败:', error)
    ElMessage.error(error.message || '处理好友请求失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取好友请求列表
onMounted(async () => {
  try {
    await friendStore.getFriendRequests()
  } catch (error) {
    console.error('获取好友请求失败:', error)
  }
})
</script> 