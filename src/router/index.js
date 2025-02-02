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
    path: '/game-board/:roomId',
    name: 'GameBoard',
    component: () => import('../views/game/GameBoard.vue'),
    props: true,
    meta: {
      requiresAuth: true
    },
    beforeEnter: (to, from, next) => {
      const gameData = localStorage.getItem(`game_${to.params.roomId}`);
      if (!gameData) {
        next({ name: 'Game', params: { roomId: to.params.roomId } });
      } else {
        next();
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 设置路由守卫
setupRouteGuards(router)

// 添加路由守卫
router.beforeEach((to, from, next) => {
  if (to.name === 'game') {
    // 进入游戏页面时不触发离开房间
    next();
  } else if (from.name === 'game' && to.name === 'lobby') {
    // 从游戏返回大厅时才触发离开房间
    wsService.leaveRoom(from.params.roomId);
    next();
  } else {
    next();
  }
});

export default router 