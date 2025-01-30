<template>
  <div class="min-h-screen bg-gradient-to-br from-bg-secondary to-bg-primary p-8">
    <div class="max-w-2xl mx-auto">
      <!-- 返回按钮 -->
      <div class="mb-8">
        <el-button 
          type="primary" 
          plain
          @click="router.back()"
        >
          <el-icon class="mr-1"><ArrowLeft /></el-icon>
          返回大厅
        </el-button>
      </div>

      <!-- 创建房间表单 -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8">
        <h2 class="text-2xl font-bold text-white mb-6">创建房间</h2>
        
        <el-form 
          ref="formRef"
          :model="roomForm"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="房间名称" prop="name">
            <el-input 
              v-model="roomForm.name"
              placeholder="请输入房间名称"
            />
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleCreate"
              :loading="loading"
            >
              创建房间
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { wsService } from '@/services/websocket'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const roomForm = ref({
  name: ''
})

const rules = {
  name: [
    { required: true, message: '请输入房间名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

const handleCreate = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await wsService.createRoom(roomForm.value.name)
    ElMessage.success('房间创建成功')
    router.push(`/room/${response.roomId}`)
  } catch (error) {
    console.error('创建房间失败:', error)
    ElMessage.error(error.message || '创建房间失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.el-form-item__label) {
  @apply text-white;
}
</style> 