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

    <!-- 原有内容，添加 relative z-10 确保在背景之上 -->
    <div class="relative z-10">
      <!-- 顶部导航栏 -->
      <header class="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div class="container mx-auto px-8 py-5 border-x border-white/20">
          <div class="flex items-center justify-between">
            <!-- Logo和标题 -->
            <div class="flex items-center space-x-6">
              <h1 class="text-2xl font-bold text-white">Fishy Brawl</h1>
            </div>

            <!-- 右侧用户区域 -->
            <div class="flex items-center space-x-8">
              <!-- 主题切换按钮 -->
              <button 
                class="text-white/80 hover:text-white transition-colors p-2"
                @click="themeStore.toggleTheme"
              >
                <el-icon class="text-2xl">
                  <component :is="themeStore.theme === 'light' ? 'Moon' : 'Sunny'" />
                </el-icon>
              </button>

              <!-- 用户信息 -->
              <div class="flex items-center space-x-4">
                <span class="text-lg text-white">{{ username }}</span>
                <el-dropdown trigger="click">
                  <div class="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors mr-4">
                    <span class="text-white text-lg font-medium">{{ userInitial }}</span>
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleLogout">
                        退出登录
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 主要内容区域 -->
      <main class="container mx-auto px-8 py-8 min-h-[calc(100vh-84px)] flex flex-col">
        <!-- 欢迎卡片 -->
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mt-12">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">
              欢迎回来，{{ username }}
            </h2>
            <p class="text-white/80">
              您的当前积分：
              <span class="text-blue-400 font-semibold">{{ userRating }}</span>
            </p>
          </div>
        </div>

        <!-- 数据统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <h3 class="text-white/60 text-sm font-medium mb-2">对战次数</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.totalGames }}</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <h3 class="text-white/60 text-sm font-medium mb-2">胜率</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.winRate }}%</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <h3 class="text-white/60 text-sm font-medium mb-2">最高积分</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.highestRating }}</p>
          </div>
        </div>

        <!-- 开始匹配按钮 -->
        <div class="flex-grow flex items-center justify-center mt-12">
          <button 
            class="transform hover:scale-110 transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white px-16 py-4 rounded-xl font-medium text-xl shadow-lg hover:shadow-2xl"
            @click="showMatchmaking = true"
          >
            开始匹配
          </button>
        </div>

        <!-- 匹配对战弹窗 -->
        <matchmaking-modal v-model:visible="showMatchmaking" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { ElMessage } from 'element-plus'
import { Moon, Sunny } from '@element-plus/icons-vue'
import MatchmakingModal from '@/components/game/MatchmakingModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 用户相关的计算属性
const username = computed(() => authStore.user?.username || '玩家')
const userInitial = computed(() => username.value[0]?.toUpperCase() || 'U')
const userRating = computed(() => authStore.user?.rating || 1000)

const showMatchmaking = ref(false)

// 计算统计数据
const stats = computed(() => ({
  totalGames: 0,
  winRate: 0,
  highestRating: userRating.value
}))

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.el-dropdown-menu {
  @apply bg-white/20 backdrop-blur-sm border-white/10;
}

.el-dropdown-item {
  @apply text-white hover:bg-white/10;
}

/* 添加按钮悬浮动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1.1);
  }
  50% {
    transform: translateY(-10px) scale(1.1);
  }
}

button:hover {
  animation: float 2s ease-in-out infinite;
}

/* 调整下拉菜单样式 */
:deep(.el-dropdown-menu) {
  @apply p-2 min-w-[120px];
}

:deep(.el-dropdown-menu__item) {
  @apply px-4 py-2 text-base rounded-lg;
}

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