<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-900 to-purple-900 relative overflow-hidden">
    <!-- 背景卡牌动画 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 10" :key="i" 
           class="card absolute"
           :style="{ 
             left: `${Math.random() * 100}%`, 
             top: `${Math.random() * 100}%`,
             animationDelay: `${Math.random() * 5}s`
           }">
      </div>
    </div>

    <!-- 左侧Logo和游戏描述 -->
    <div class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 text-white z-10">
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold mb-4">Fishy Brawl</h1>
      </div>
      <div class="max-w-md text-center">
        <p class="text-lg mb-4">
          Fishy Brawl 是一款轻便的多人在线类酒馆战旗的对战游戏，旨在为玩家提供随时随地、爽快的对战体验。
        </p>
        <ul class="text-left list-disc list-inside mb-4">
          <li>快速匹配，随时开战</li>
          <li>简单易上手的战旗玩法</li>
          <li>丰富多样的种族角色</li>
          <li>独特的主题对战场景</li>
        </ul>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
      <div class="max-w-md w-full bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg shadow-xl overflow-hidden">
        <div class="p-8">
          <h2 class="text-3xl font-bold text-center text-white mb-6">登录</h2>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <label for="email" class="text-sm font-medium text-gray-200 block mb-2">邮箱地址</label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-20 text-white placeholder-gray-300"
                placeholder="请输入邮箱地址"
              />
            </div>
            <div>
              <label for="password" class="text-sm font-medium text-gray-200 block mb-2">密码</label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-20 text-white placeholder-gray-300"
                placeholder="请输入密码"
              />
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input type="checkbox" v-model="rememberMe" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <span class="ml-2 text-sm text-gray-200">记住我</span>
              </label>
              <router-link to="/forgot-password" class="text-sm text-blue-300 hover:underline">
                忘记密码？
              </router-link>
            </div>
            <div>
              <button
                type="submit"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
                :disabled="loading"
              >
                {{ loading ? '登录中...' : '登录' }}
              </button>
            </div>
          </form>
          <div class="mt-6 text-center">
            <p class="text-gray-300">
              还没有账号？
              <router-link to="/register" class="text-blue-300 hover:underline">
                立即注册
              </router-link>
            </p>
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
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)

const handleSubmit = async () => {
  try {
    loading.value = true
    await authStore.login(email.value, password.value)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card {
  width: 100px;
  height: 140px;
  background: linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
  border-radius: 10px;
  opacity: 0.1;
  animation: cardFloat 10s infinite linear;
}

@keyframes cardFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(100vw, 100vh) rotate(360deg);
  }
}

@media (max-width: 1023px) {
  .card {
    animation: cardFloatMobile 15s infinite linear;
  }

  @keyframes cardFloatMobile {
    0% {
      transform: translate(0, 0) rotate(0deg);
    }
    100% {
      transform: translate(100vw, 50vh) rotate(360deg);
    }
  }
}
</style> 