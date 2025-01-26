<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-text-secondary">
        邮箱地址
      </label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        class="w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="请输入邮箱地址"
        :disabled="loading"
      />
    </div>
    
    <div class="space-y-2">
      <label for="password" class="block text-sm font-medium text-text-secondary">
        密码
      </label>
      <div class="relative">
        <input
          id="password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          required
          class="w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="请输入密码"
          :disabled="loading"
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

    <div class="flex items-center justify-between">
      <el-checkbox v-model="rememberMe" class="text-text-secondary">
        记住我
      </el-checkbox>
      <router-link 
        to="/forgot-password"
        class="text-sm text-primary hover:underline"
      >
        忘记密码？
      </router-link>
    </div>

    <button 
      type="submit" 
      class="w-full py-2 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors flex items-center justify-center space-x-2"
      :disabled="loading"
    >
      <el-icon v-if="loading" class="animate-spin">
        <Loading />
      </el-icon>
      <span>{{ loading ? '登录中...' : '登录' }}</span>
    </button>

    <div class="text-center text-sm text-text-secondary">
      <span>还没有账号？</span>
      <router-link to="/register" class="text-primary hover:underline">
        立即注册
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
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)

const validateForm = () => {
  if (!email.value || !password.value) {
    ElMessage.warning('请填写邮箱和密码')
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return false
  }

  if (password.value.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    const response = await authStore.login(email.value, password.value)
    
    if (response.code === 200) {
      if (rememberMe.value) {
        localStorage.setItem('rememberedEmail', email.value)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      ElMessage.success(response.message || '登录成功')
      
      // 如果有重定向地址，则跳转到重定向地址
      const redirect = router.currentRoute.value.query.redirect
      router.push(redirect || '/')
    }
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}

// 如果之前记住了邮箱，自动填充
if (localStorage.getItem('rememberedEmail')) {
  email.value = localStorage.getItem('rememberedEmail')
  rememberMe.value = true
}
</script>

<style lang="scss">
.login-form {
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

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    .remember-me {
      color: var(--text-secondary);
    }

    .forgot-password {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }

  button[type="submit"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    .loading {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .form-footer {
    margin-top: 2rem;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.875rem;

    a {
      color: var(--primary-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style> 