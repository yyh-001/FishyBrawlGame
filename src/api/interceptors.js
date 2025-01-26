import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例，使用相对路径
export const api = axios.create({
  baseURL: '/api',
  timeout: 15000, // 增加超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    // 添加重试配置
    config.retry = 3 // 最大重试次数
    config.retryDelay = 1000 // 重试间隔
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error

    // 处理重试逻辑
    if (!response && !config._retry && config.retry) {
      config._retry = 0
      const retryHandler = async () => {
        config._retry++
        if (config._retry <= config.retry) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay))
          ElMessage.warning(`网络请求失败，正在进行第${config._retry}次重试...`)
          return api(config)
        }
        throw error
      }
      return retryHandler()
    }
    
    if (response) {
      const { code, message, errors } = response.data

      // 处理表单验证错误
      if (code === 400 && errors) {
        const errorMessages = errors.map(err => `${err.param}: ${err.msg}`).join('\n')
        ElMessage.error(errorMessages)
        return Promise.reject(response.data)
      }

      // 处理特定错误码
      switch (code) {
        case 401:
          if (message === '未提供有效的认证令牌') {
            const authStore = useAuthStore()
            authStore.logout()
            router.push({
              path: '/login',
              query: { redirect: router.currentRoute.value.fullPath }
            })
          }
          ElMessage.error(message || '认证失败')
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
        case 503:
          ElMessage.error('服务暂时不可用，请稍后重试')
          break
        case 1001:
          ElMessage.error('验证码错误或已过期')
          break
        case 1002:
          ElMessage.error('邮箱已被注册')
          break
        case 1003:
          ElMessage.error('重置密码令牌无效或已过期')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(message || '请求失败')
      }
      return Promise.reject(response.data)
    }
    
    // 处理网络错误
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 添加网络状态监听
window.addEventListener('online', () => {
  ElMessage.success('网络已恢复')
})

window.addEventListener('offline', () => {
  ElMessage.error('网络已断开')
}) 