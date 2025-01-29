import { ref, onMounted, onUnmounted } from 'vue'

export function useResponsive() {
  // 使用 ref 存储回调函数引用，以便正确移除事件监听
  const isMobile = ref(false)
  const resizeHandler = ref(null)

  // 初始化检查函数
  const initMobileCheck = () => {
    // 确保在浏览器环境中运行
    if (typeof window !== 'undefined') {
      isMobile.value = window.innerWidth <= 768
    }
  }

  // 创建防抖函数
  const debounce = (fn, delay = 200) => {
    let timer = null
    return (...args) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  }

  onMounted(() => {
    // 初始检查
    initMobileCheck()

    // 创建防抖的 resize 处理函数
    resizeHandler.value = debounce(() => {
      initMobileCheck()
    })

    // 添加事件监听
    window.addEventListener('resize', resizeHandler.value)

    // 确保初始值正确
    Promise.resolve().then(() => {
      initMobileCheck()
    })
  })

  onUnmounted(() => {
    // 移除事件监听
    if (resizeHandler.value) {
      window.removeEventListener('resize', resizeHandler.value)
      resizeHandler.value = null
    }
  })

  return {
    isMobile
  }
} 