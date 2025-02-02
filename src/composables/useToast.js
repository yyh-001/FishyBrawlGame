import { ElMessage } from 'element-plus'

export const useToast = () => {
  const success = (message) => {
    ElMessage.success(message)
  }

  const error = (message) => {
    ElMessage.error(message)
  }

  const info = (message) => {
    ElMessage.info(message)
  }

  const warning = (message) => {
    ElMessage.warning(message)
  }

  return {
    success,
    error,
    info,
    warning
  }
} 