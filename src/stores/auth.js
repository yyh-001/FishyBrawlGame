import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const isAuthenticated = ref(!!localStorage.getItem('token'))
  const loading = ref(false)

  const login = async (email, password) => {
    loading.value = true
    try {
      const response = await authApi.login(email, password)
      if (response?.data?.code === 200) {  // 检查响应状态码
        token.value = response.data.data.token
        user.value = response.data.data.userInfo || { 
          username: email.split('@')[0],
          email: email,
          rating: 1000
        }
        localStorage.setItem('token', token.value)
        localStorage.setItem('userInfo', JSON.stringify(user.value))
        isAuthenticated.value = true
        return response.data
      } else {
        throw new Error(response?.data?.message || '登录失败')
      }
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

  // 初始化时从localStorage恢复用户信息
  const initializeFromStorage = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        user.value = JSON.parse(storedUserInfo)
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