<template>
  <div 
    class="minion-card bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
    :class="{
      'border-2 border-blue-500': purchasable,
      'border-2 border-yellow-500': selected
    }"
    @click="$emit('click')"
  >
    <!-- 随从名称 -->
    <div class="name text-white font-medium text-center mb-2 truncate">
      {{ minion.name }}
    </div>

    <!-- 随从属性 -->
    <div class="stats flex justify-center gap-4 mb-2">
      <span class="attack flex items-center">
        <span class="text-red-500 font-bold">⚔️ {{ minion.attack }}</span>
      </span>
      <span class="health flex items-center">
        <span class="text-green-500 font-bold">❤️ {{ minion.health }}</span>
      </span>
    </div>

    <!-- 随从描述 -->
    <div class="description text-sm text-gray-300 mb-2 text-center">
      {{ minion.description }}
    </div>

    <!-- 随从种族和等级 -->
    <div class="flex justify-between items-center text-xs text-gray-400 mt-auto">
      <span class="tribe capitalize">
        {{ minion.tribe || '无种族' }}
      </span>
      <span class="tier">
        ⭐ {{ minion.tier }}
      </span>
    </div>

    <!-- 随从技能(如果有) -->
    <div v-if="minion.abilities?.length" class="abilities mt-2 text-xs text-gray-300">
      <div v-for="ability in minion.abilities" :key="ability" class="ability">
        • {{ ability }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  minion: {
    type: Object,
    required: true,
    default: () => ({
      name: '未知随从',
      attack: 0,
      health: 0,
      tier: 1,
      tribe: '',
      abilities: [],
      description: '普通随从'
    })
  },
  purchasable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.minion-card {
  width: 120px;
  height: 160px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.minion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.description {
  font-size: 0.75rem;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.abilities {
  max-height: 40px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.abilities::-webkit-scrollbar {
  width: 4px;
}

.abilities::-webkit-scrollbar-track {
  background: transparent;
}

.abilities::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style> 