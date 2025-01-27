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
            创建账号开始您的对战之旅，在这里您可以体验独特的卡牌对战玩法，结交志同道合的玩家。
          </p>
          <ul class="text-left list-disc list-inside mb-4 space-y-2">
            <li>快速匹配，随时开战</li>
            <li>简单易上手的战旗玩法</li>
            <li>丰富多样的种族角色</li>
            <li>独特的主题对战场景</li>
          </ul>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div class="w-full max-w-md">
          <div class="text-center lg:text-left mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">创建账号</h2>
            <p class="text-white/80">填写信息开始您的游戏之旅</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div>
                <label for="email" class="text-sm font-medium text-gray-200 block mb-2">邮箱地址</label>
                <div class="flex gap-2">
                  <input
                    id="email"
                    v-model="email"
                    type="email"
                    required
                    class="flex-1 px-3 py-2 bg-white/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入邮箱地址"
                  />
                  <button 
                    type="button"
                    class="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    @click="handleSendCode"
                    :disabled="loading || codeSending || countdown > 0"
                  >
                    <template v-if="countdown > 0">
                      <span class="text-xs">{{ countdown }}</span>
                    </template>
                    <template v-else>
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2L15 22L11 13L2 9L22 2z"></path>
                      </svg>
                    </template>
                  </button>
                </div>
              </div>

              <div>
                <label for="verificationCode" class="text-sm font-medium text-gray-200 block mb-2">验证码</label>
                <input
                  id="verificationCode"
                  v-model="verificationCode"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入验证码"
                />
              </div>

              <div>
                <label for="username" class="text-sm font-medium text-gray-200 block mb-2">用户名</label>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label for="password" class="text-sm font-medium text-gray-200 block mb-2">密码</label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                  class="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入密码"
                />
              </div>
              <div>
                <label for="confirmPassword" class="text-sm font-medium text-gray-200 block mb-2">确认密码</label>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  required
                  class="w-full px-3 py-2 bg-white/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请再次输入密码"
                />
              </div>
              <div class="flex items-center">
                <input
                  id="terms"
                  v-model="agreeToTerms"
                  type="checkbox"
                  required
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="terms" class="ml-2 text-sm text-gray-200">
                  我已阅读并同意
                  <a href="#" class="text-blue-400 hover:underline">服务条款</a>
                  和
                  <a href="#" class="text-blue-400 hover:underline">隐私政策</a>
                </label>
              </div>
              <button
                type="submit"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                :disabled="loading"
              >
                {{ loading ? '注册中...' : '立即注册' }}
              </button>
            </form>
            <div class="mt-6 text-center">
              <p class="text-gray-300">
                已有账号？
                <router-link to="/login" class="text-blue-400 hover:underline">
                  立即登录
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
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const verificationCode = ref('')
const agreeToTerms = ref(false)
const loading = ref(false)
const codeSending = ref(false)
const countdown = ref(0)

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 发送验证码
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
  } finally {
    codeSending.value = false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    await authStore.register({
      email: email.value,
      username: username.value,
      password: password.value,
      verificationCode: verificationCode.value
    })
    ElMessage.success('注册成功')
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  if (!email.value || !username.value || !password.value || !confirmPassword.value || !verificationCode.value) {
    ElMessage.warning('请填写所有必填项')
    return false
  }

  if (password.value !== confirmPassword.value) {
    ElMessage.error('两次输入的密码不一致')
    return false
  }

  if (!agreeToTerms.value) {
    ElMessage.warning('请阅读并同意服务条款和隐私政策')
    return false
  }

  return true
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