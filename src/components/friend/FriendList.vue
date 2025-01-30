<template>
  <div class="friend-list">
    <!-- 标题和刷新按钮 -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold text-white">好友列表</h3>
      <el-button 
        type="primary" 
        size="small"
        @click="refreshFriends"
        :loading="loading"
      >
        刷新
      </el-button>
    </div>

    <!-- 好友列表内容 -->
    <div v-if="friendStore.friends.length > 0" class="space-y-2">
      <div 
        v-for="friend in friendStore.friends" 
        :key="friend.userId"
        class="bg-white/10 rounded-lg p-3"
        :class="{ 'opacity-60': friend.status !== 'online' }"
      >
        <FriendItem 
          :friend="friend" 
          @click="handleFriendClick"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-else
      class="text-center py-8 text-white/60"
    >
      暂无好友
    </div>

    <!-- 好友详情弹窗 -->
    <friend-detail
      :visible="showDetail"
      @update:visible="showDetail = $event"
      :friend="selectedFriend"
      @remove="handleRemoveFriend"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFriendStore } from '@/stores/friend'
import { storeToRefs } from 'pinia'
import FriendItem from './FriendItem.vue'
import FriendDetail from './FriendDetail.vue'

const friendStore = useFriendStore()
const { loading } = storeToRefs(friendStore)

const showDetail = ref(false)
const selectedFriend = ref(null)

// 获取好友列表
const refreshFriends = async () => {
  try {
    await friendStore.getFriends()
  } catch (error) {
    ElMessage.error(error.message || '获取好友列表失败')
  }
}

// 删除好友
const handleRemoveFriend = async (friend) => {
  try {
    await friendStore.removeFriend(friend.userId)
    ElMessage.success('好友删除成功')
    showDetail.value = false
    refreshFriends()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除好友失败')
    }
  }
}

// 处理好友点击
const handleFriendClick = (friend) => {
  console.log('点击好友:', friend)
  selectedFriend.value = friend
  showDetail.value = true
  console.log('showDetail:', showDetail.value)
}

// 监听 showDetail 的变化
watch(showDetail, (newVal) => {
  console.log('showDetail changed:', newVal)
})

onMounted(() => {
  refreshFriends()
})
</script>

<style scoped>
:deep(.el-collapse) {
  --el-collapse-header-bg-color: transparent;
  --el-collapse-header-text-color: rgba(255, 255, 255, 0.8);
  --el-collapse-content-bg-color: transparent;
  --el-collapse-border-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-collapse-item__header) {
  padding: 8px 0;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
</style> 