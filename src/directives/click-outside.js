export const clickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      // 检查点击事件是否发生在元素外部
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
} 