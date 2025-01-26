<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 relative overflow-hidden">
    <!-- 背景卡牌动画 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 12" :key="i" 
        class="card absolute"
        :style="{ 
          left: `${Math.random() * 100}%`, 
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${15 + Math.random() * 15}s`,
          width: `${80 + Math.random() * 40}px`,
          height: `${120 + Math.random() * 40}px`,
          opacity: 0.1 + Math.random() * 0.1
        }"
      ></div>
    </div>

    <!-- 主要内容 -->
    <div class="relative z-10 min-h-screen flex flex-col lg:flex-row">
      <!-- 左侧介绍区域 -->
      <div class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 text-white">
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold mb-4">Fishy Brawl</h1>
        </div>
        <div class="max-w-md text-center">
          <p class="text-lg mb-4">
            忘记密码了？别担心，我们会帮您找回账号。请输入您注册时使用的邮箱地址，我们将向您发送重置密码的链接。
          </p>
        </div>
      </div>

      <!-- 右侧重置密码表单 -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div class="w-full max-w-md">
          <div class="text-center lg:text-left mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">找回密码</h2>
            <p class="text-white/80">输入邮箱地址重置您的密码</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div>
                <label for="email" class="text-sm font-medium text-gray-200 block mb-2">邮箱地址</label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  class="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入邮箱地址"
                />
              </div>
              <button
                type="submit"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                :disabled="loading"
              >
                {{ loading ? '发送中...' : '发送重置链接' }}
              </button>
            </form>
            <div class="mt-6 text-center">
              <p class="text-gray-300">
                想起密码了？
                <router-link to="/login" class="text-blue-400 hover:underline">
                  返回登录
                </router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  try {
    loading.value = true
    await authStore.sendResetPasswordEmail(email.value)
    ElMessage.success('重置链接已发送到您的邮箱')
    router.push('/login')
  } catch (error) {
    console.error('发送失败:', error)
    ElMessage.error(error.message || '发送失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 卡牌背景动画 */
.card {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 10px;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255,255,255,0.1);
  animation: cardFloat linear infinite;
  transform-origin: center;
}

@keyframes cardFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(calc(100vw + 200px), calc(100vh + 200px)) rotate(360deg);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .card {
    animation-duration: 20s !important;
  }

  @keyframes cardFloat {
    0% {
      transform: translate(0, 0) rotate(0deg);
    }
    100% {
      transform: translate(calc(100vw + 100px), calc(50vh + 100px)) rotate(360deg);
    }
  }
}

/* 确保内容区域的背景模糊效果 */
.bg-white\/10 {
  backdrop-filter: blur(8px);
}
</style> 