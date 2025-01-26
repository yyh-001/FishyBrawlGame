<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- 第一步：输入邮箱和验证码 -->
    <template v-if="step === 1">
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
        <label class="form-label">验证码</label>
        <input
          v-model="verificationCode"
          type="text"
          class="form-input"
          placeholder="请输入验证码"
          required
        />
      </div>

      <button 
        type="button" 
        class="btn btn-primary w-full"
        :disabled="loading"
        @click="handleVerifyCode"
      >
        <el-icon v-if="loading" class="animate-spin mr-2">
          <Loading />
        </el-icon>
        <span>{{ loading ? '验证中...' : '下一步' }}</span>
      </button>
    </template>

    <!-- 第二步：设置新密码 -->
    <template v-else>
      <div class="space-y-2">
        <label class="form-label">新密码</label>
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请设置新密码"
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
        <label class="form-label">确认新密码</label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请再次输入新密码"
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
        <span>{{ loading ? '重置中...' : '重置密码' }}</span>
      </button>
    </template>

    <div class="text-center text-sm text-text-secondary">
      <router-link to="/login" class="text-primary hover:underline">
        返回登录
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

const step = ref(1)
const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const codeSending = ref(false)
const countdown = ref(0)
const resetToken = ref('')
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
  
  try {
    codeSending.value = true
    const response = await authStore.sendResetPasswordCode(email.value)
    if (response.code === 200) {
      ElMessage.success(response.message || '验证码已发送')
      startCountdown()
    }
  } catch (error) {
    console.error('Send reset code failed:', error)
  } finally {
    codeSending.value = false
  }
}

const handleVerifyCode = async () => {
  if (!email.value || !verificationCode.value) {
    ElMessage.warning('请填写邮箱和验证码')
    return
  }

  try {
    loading.value = true
    const response = await authStore.verifyResetCode(email.value, verificationCode.value)
    if (response.code === 200) {
      resetToken.value = response.data.resetToken
      step.value = 2
    }
  } catch (error) {
    console.error('Verify code failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (newPassword.value.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  try {
    loading.value = true
    const response = await authStore.resetPassword(resetToken.value, newPassword.value)
    if (response.code === 200) {
      ElMessage.success(response.message || '密码重置成功')
      router.push('/login')
    }
  } catch (error) {
    console.error('Reset password failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.forgot-password-form {
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