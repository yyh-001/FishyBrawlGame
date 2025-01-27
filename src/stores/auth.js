import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { connectWebSocket, disconnectWebSocket } from '@/services/websocket'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const isAuthenticated = ref(!!localStorage.getItem('token'))
  const loading = ref(false)

  const login = async (email, password) => {
    loading.value = true
    try {
      const response = await authApi.login(email, password)
      if (response?.data?.code === 200) {
        token.value = response.data.data.token
        user.value = response.data.data.userInfo
        localStorage.setItem('token', token.value)
        localStorage.setItem('userInfo', JSON.stringify(user.value))
        isAuthenticated.value = true
        
        // 确保传入正确的 token
        connectWebSocket(response.data.data.token)
        
        return response.data
      }
      throw new Error(response?.data?.message || '登录失败')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    try {
      const response = await authApi.register(userData)
      if (response?.data?.code === 200) {
        return response.data
      } else {
        throw new Error(response?.data?.message || '注册失败')
      }
    } catch (error) {
      console.error('Register error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    // 登出时断开 WebSocket
    disconnectWebSocket()
  }

  const sendVerificationCode = async (email, type = 'register') => {
    loading.value = true
    try {
      const response = await authApi.sendVerificationCode(email, type)
      if (response?.data?.code === 200) {
        return response.data
      } else {
        throw new Error(response?.data?.message || '发送验证码失败')
      }
    } catch (error) {
      console.error('Send verification code error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const sendResetPasswordCode = async (email) => {
    loading.value = true
    try {
      const response = await authApi.sendResetPasswordCode(email)
      if (response?.data?.code === 200) {
        return response.data
      } else {
        throw new Error(response?.data?.message || '发送重置密码验证码失败')
      }
    } catch (error) {
      console.error('Send reset password code error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const verifyResetCode = async (email, code) => {
    loading.value = true
    try {
      const response = await authApi.verifyResetCode(email, code)
      if (response?.data?.code === 200) {
        return response.data
      } else {
        throw new Error(response?.data?.message || '验证码验证失败')
      }
    } catch (error) {
      console.error('Verify reset code error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (resetToken, newPassword) => {
    loading.value = true
    try {
      const response = await authApi.resetPassword(resetToken, newPassword)
      if (response?.data?.code === 200) {
        return response.data
      } else {
        throw new Error(response?.data?.message || '重置密码失败')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (oldPassword, newPassword) => {
    loading.value = true
    try {
      const response = await authApi.changePassword(oldPassword, newPassword)
      if (response?.data?.code === 200) {
        return response.data
      } else {
        throw new Error(response?.data?.message || '修改密码失败')
      }
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 在创建 store 时初始化
  const initializeFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      isAuthenticated.value = true
      try {
        const storedUser = JSON.parse(localStorage.getItem('userInfo'))
        if (storedUser) {
          user.value = storedUser
        }
        // 如果有token就连接WebSocket
        connectWebSocket(storedToken)
      } catch (e) {
        console.error('Failed to parse stored user info:', e)
        logout() // 如果解析失败，清除存储的信息
      }
    }
  }

  // 在创建 store 时初始化
  initializeFromStorage()

  return {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    sendVerificationCode,
    sendResetPasswordCode,
    verifyResetCode,
    resetPassword,
    changePassword
  }
}) 