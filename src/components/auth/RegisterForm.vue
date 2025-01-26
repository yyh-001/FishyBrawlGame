<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="space-y-2">
      <label class="form-label">邮箱地址</label>
      <div class="flex gap-2">
        <input
          v-model="email"
          type="email"
          class="form-input"
          placeholder="请输入邮箱地址"
          required
        />
        <button 
          type="button" 
          class="btn btn-secondary whitespace-nowrap min-w-[120px]"
          @click="handleSendCode"
          :disabled="codeSending || countdown > 0"
        >
          {{ countdown > 0 ? `${countdown}秒` : '获取验证码' }}
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <label class="form-label">用户名</label>
      <input
        v-model="username"
        type="text"
        class="form-input"
        placeholder="请设置用户名"
        required
      />
    </div>

    <div class="space-y-2">
      <label class="form-label">验证码</label>
      <input
        v-model="verificationCode"
        type="text"
        class="form-input"
        placeholder="请输入验证码"
        required
      />
    </div>

    <div class="space-y-2">
      <label class="form-label">密码</label>
      <div class="relative">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="form-input"
          placeholder="请设置密码"
          required
          minlength="6"
        />
        <button 
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
          @click="showPassword = !showPassword"
        >
          <el-icon>
            <component :is="showPassword ? 'View' : 'Hide'" />
          </el-icon>
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <label class="form-label">确认密码</label>
      <div class="relative">
        <input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          class="form-input"
          placeholder="请再次输入密码"
          required
          minlength="6"
        />
        <button 
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
          @click="showConfirmPassword = !showConfirmPassword"
        >
          <el-icon>
            <component :is="showConfirmPassword ? 'View' : 'Hide'" />
          </el-icon>
        </button>
      </div>
    </div>

    <button 
      type="submit" 
      class="btn btn-primary w-full"
      :disabled="loading"
    >
      <el-icon v-if="loading" class="animate-spin mr-2">
        <Loading />
      </el-icon>
      <span>{{ loading ? '注册中...' : '注册' }}</span>
    </button>

    <div class="text-center text-sm text-text-secondary">
      <span>已有账号？</span>
      <router-link to="/login" class="text-primary hover:underline">
        立即登录
      </router-link>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { View, Hide, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const username = ref('')
const verificationCode = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const codeSending = ref(false)
const countdown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (!email.value) {
    ElMessage.warning('请输入邮箱地址')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  
  try {
    codeSending.value = true
    const response = await authStore.sendVerificationCode(email.value, 'register')
    if (response.code === 200) {
      ElMessage.success(response.message || '验证码已发送')
      startCountdown()
    }
  } catch (error) {
    console.error('Send code failed:', error)
    // 如果是网络错误，显示重试按钮
    if (!error.code) {
      ElMessage.error({
        message: '发送失败，请检查网络连接',
        duration: 5000,
        showClose: true
      })
    }
  } finally {
    codeSending.value = false
  }
}

const validateForm = () => {
  if (!email.value || !username.value || !password.value || !confirmPassword.value || !verificationCode.value) {
    ElMessage.warning('请填写所有必填项')
    return false
  }

  if (password.value.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return false
  }

  if (password.value !== confirmPassword.value) {
    ElMessage.error('两次输入的密码不一致')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    const response = await authStore.register({
      email: email.value,
      username: username.value,
      password: password.value,
      verificationCode: verificationCode.value
    })

    if (response.code === 200) {
      ElMessage.success(response.message || '注册成功')
      router.push('/login')
    }
  } catch (error) {
    // 错误处理已经在 interceptor 中统一处理
    console.error('Registration failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-form {
  .input-group {
    display: flex;
    gap: 0.5rem;

    input {
      flex: 1;
    }

    button {
      white-space: nowrap;
      min-width: 120px;
    }
  }
}
</style> 