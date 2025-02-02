<template>
  <div class="game-card">
    <div class="card-content bg-gray-800 rounded-lg p-4">
      <!-- 卡牌标题 -->
      <div class="card-header flex justify-between items-center mb-2">
        <h3 class="text-lg font-bold text-yellow-500 truncate">{{ card.name }}</h3>
        <div class="stats flex items-center space-x-2">
          <span class="attack text-red-500">⚔️ {{ card.attack }}</span>
          <span class="health text-green-500">❤️ {{ card.health }}</span>
        </div>
      </div>

      <!-- 卡牌描述 -->
      <p class="text-gray-300 text-sm mb-3 line-clamp-2">{{ card.description }}</p>

      <!-- 卡牌类型和费用 -->
      <div class="card-footer flex justify-between items-center">
        <span class="card-type text-xs px-2 py-1 rounded"
              :class="getTypeClass(card.type)">
          {{ getTypeText(card.type) }}
        </span>
        <span class="cost text-yellow-500" v-if="card.cost">
          💰 {{ card.cost }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: {
    type: Object,
    required: true,
    default: () => ({
      name: '未知卡牌',
      attack: 0,
      health: 0,
      description: '暂无描述',
      type: 'minion',
      cost: 0
    })
  }
});

// 获取卡牌类型样式
const getTypeClass = (type) => {
  const classes = {
    minion: 'bg-blue-600',
    spell: 'bg-purple-600',
    weapon: 'bg-orange-600'
  };
  return classes[type] || 'bg-gray-600';
};

// 获取卡牌类型文本
const getTypeText = (type) => {
  const texts = {
    minion: '随从',
    spell: '法术',
    weapon: '武器'
  };
  return texts[type] || '未知';
};
</script>

<style scoped>
.game-card {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-footer {
  margin-top: auto;
}

.card-type {
  font-size: 0.75rem;
  opacity: 0.9;
}

/* 拖拽相关样式 */
.game-card[draggable="true"] {
  cursor: grab;
}

.game-card[draggable="true"]:active {
  cursor: grabbing;
}
</style> 