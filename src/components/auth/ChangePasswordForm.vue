<template>
  <form @submit.prevent="handleSubmit" class="change-password-form">
    <div class="form-group">
      <label for="oldPassword">当前密码</label>
      <div class="password-input">
        <input
          id="oldPassword"
          v-model="oldPassword"
          :type="showOldPassword ? 'text' : 'password'"
          required
          placeholder="请输入当前密码"
          :disabled="loading"
        />
        <button 
          type="button" 
          class="toggle-password"
          @click="showOldPassword = !showOldPassword"
        >
          <el-icon>
            <component :is="showOldPassword ? 'View' : 'Hide'" />
          </el-icon>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label for="newPassword">新密码</label>
      <div class="password-input">
        <input
          id="newPassword"
          v-model="newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          required
          placeholder="请输入新密码"
          :disabled="loading"
          minlength="6"
        />
        <button 
          type="button" 
          class="toggle-password"
          @click="showNewPassword = !showNewPassword"
        >
          <el-icon>
            <component :is="showNewPassword ? 'View' : 'Hide'" />
          </el-icon>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label for="confirmPassword">确认新密码</label>
      <div class="password-input">
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          required
          placeholder="请再次输入新密码"
          :disabled="loading"
          minlength="6"
        />
        <button 
          type="button" 
          class="toggle-password"
          @click="showConfirmPassword = !showConfirmPassword"
        >
          <el-icon>
            <component :is="showConfirmPassword ? 'View' : 'Hide'" />
          </el-icon>
        </button>
      </div>
    </div>

    <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
      <template v-if="loading">
        <el-icon class="loading"><Loading /></el-icon>
        修改中...
      </template>
      <template v-else>
        修改密码
      </template>
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { View, Hide, Loading } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const validateForm = () => {
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    ElMessage.warning('请填写所有密码字段')
    return false
  }

  if (newPassword.value.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return false
  }

  if (newPassword.value === oldPassword.value) {
    ElMessage.warning('新密码不能与当前密码相同')
    return false
  }

  if (newPassword.value !== confirmPassword.value) {
    ElMessage.error('两次输入的新密码不一致')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    const response = await authStore.changePassword(oldPassword.value, newPassword.value)
    if (response.code === 200) {
      ElMessage.success(response.message || '密码修改成功')
      // 清空表单
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    }
  } catch (error) {
    console.error('Change password failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.change-password-form {
  .password-input {
    position: relative;
    
    .toggle-password {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      
      &:hover {
        color: var(--primary-color);
      }
    }
  }

  button[type="submit"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;

    .loading {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}
</style> 