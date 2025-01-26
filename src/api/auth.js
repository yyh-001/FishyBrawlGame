import { api } from './interceptors'

export const authApi = {
  // 发送验证码
  sendVerificationCode(email, type = 'register') {
    return api.post('/auth/verification-code', { email, type })
  },

  // 用户注册
  register({ email, password, username, verificationCode }) {
    return api.post('/auth/register', {
      email,
      password,
      username,
      verificationCode
    })
  },

  // 用户登录
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },

  // 发送重置密码验证码
  sendResetPasswordCode(email) {
    return api.post('/auth/reset-password-code', { email })
  },

  // 验证重置密码验证码
  verifyResetCode(email, verificationCode) {
    return api.post('/auth/verify-reset-code', {
      email,
      verificationCode
    })
  },

  // 重置密码
  resetPassword(resetToken, newPassword) {
    return api.post('/auth/reset-password', {
      resetToken,
      newPassword
    })
  },

  // 修改密码
  changePassword(oldPassword, newPassword) {
    return api.put('/auth/password', {
      oldPassword,
      newPassword
    })
  }
} 