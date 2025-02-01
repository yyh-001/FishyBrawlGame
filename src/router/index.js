import { createRouter, createWebHistory } from 'vue-router'
import { setupRouteGuards } from './guards'
import { useWebSocket } from '@/composables/useWebSocket'
import { wsService } from '@/services/websocket'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPasswordView.vue')
  },
  {
    path: '/game/:roomId',
    name: 'Game',
    component: () => import('@/views/game/GameView.vue'),
    meta: {
      requiresAuth: true
    },
    beforeEnter: async (to, from, next) => {
      const wsService = useWebSocket()
      
      // 确保WebSocket连接
      if (!wsService.socket?.connected) {
        try {
          await wsService.ensureConnected()
        } catch (error) {
          console.error('WebSocket连接失败:', error)
          next({ name: 'Home' })
          return
        }
      }
      
      next()
    }
  },
  {
    path: '/room/:roomId',
    name: 'RoomDetail',
    component: () => import('@/views/RoomView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/game/:roomId',
    name: 'game',
    component: () => import('@/views/game/GameBoard.vue'),
    props: true,
    meta: { requiresAuth: true },
    beforeEnter: async (to, from, next) => {
      const wsService = useWebSocket()
      
      // 确保WebSocket连接
      if (!wsService.socket?.connected) {
        try {
          await wsService.ensureConnected()
        } catch (error) {
          console.error('WebSocket连接失败:', error)
          next({ name: 'Home' })
          return
        }
      }
      
      next()
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 设置路由守卫
setupRouteGuards(router)

// 添加全局事件监听
wsService.on('gameStart', (data) => {
  const { roomId, gameData } = data;
  // 存储游戏初始数据
  localStorage.setItem(`game_${roomId}`, JSON.stringify(gameData));
  // 跳转到游戏页面
  router.push(`/game/${roomId}`);
});

export default router 