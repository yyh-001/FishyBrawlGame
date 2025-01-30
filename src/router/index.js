import { createRouter, createWebHistory } from 'vue-router'
import { setupRouteGuards } from './guards'

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
    component: () => import('../views/game/GameView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/room/:roomId',
    name: 'RoomDetail',
    component: () => import('@/views/RoomView.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 设置路由守卫
setupRouteGuards(router)

export default router 