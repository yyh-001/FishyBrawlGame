import { useAuthStore } from '@/stores/auth'

// 需要登录才能访问的路由
const authRoutes = ['Home']

export function setupRouteGuards(router) {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    // 检查是否需要认证
    const requiresAuth = authRoutes.includes(to.name)
    
    if (requiresAuth && !authStore.isAuthenticated) {
      // 保存原始目标路由，登录后跳转
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else if (authStore.isAuthenticated && ['Login', 'Register', 'ForgotPassword'].includes(to.name)) {
      // 已登录用户不能访问登录相关页面
      next('/')
    } else {
      next()
    }
  })
} 