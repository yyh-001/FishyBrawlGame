import { defineStore } from 'pinia'
import { ref } from 'vue'
import { wsService } from '@/services/websocket'
import { ElMessage } from 'element-plus'

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const gameState = ref({
    coins: 3,
    tavernTier: 1,
    maxTavernTier: 6,
    turn: 1,
    phase: 'preparation', // preparation | combat
    shopMinions: [], // 商店随从
    handCards: [],
    board: {},
    players: [],
    currentPlayer: null,
    hero: null,
    loading: false
  })

  // 初始化游戏
  const initializeGame = async (gameData) => {
    if (gameData) {
      gameState.value = {
        ...gameState.value,
        ...gameData
      }
    }
  }

  // 购买随从
  const buyMinion = async (minionId) => {
    if (gameState.value.coins >= 3) {
      wsService.emit('game:buyMinion', { minionId })
    }
  }

  // 放置随从
  const placeMinion = async (minionId, position) => {
    wsService.emit('game:placeMinion', { minionId, position })
  }

  // 使用英雄技能
  const useHeroPower = async () => {
    wsService.emit('game:useHeroPower')
  }

  // 刷新商店
  const refreshShop = async (roomId) => {
    try {
      console.log('🔄 开始刷新商店:', {
        phase: gameState.value.phase,
        coins: gameState.value.coins,
        roomId
      });

      if (!wsService.connected.value) {
        throw new Error('WebSocket 未连接');
      }

      if (gameState.value.phase !== 'preparation') {
        throw new Error('当前不是准备阶段');
      }

      if (gameState.value.coins < 1) {
        throw new Error('金币不足');
      }

      gameState.value.loading = true;

      const response = await wsService.refreshShop({ roomId });
      console.log('📦 刷新商店响应:', response);

      if (response.success) {
        gameState.value.shopMinions = response.data.minions;
        gameState.value.coins = response.data.remainingCoins;
        console.log('🎮 商店随从已更新:', {
          count: gameState.value.shopMinions.length,
          minions: gameState.value.shopMinions
        });
        ElMessage.success('商店刷新成功');
      } else {
        throw new Error(response.error);
      }

      return response;
    } catch (error) {
      console.error('❌ 刷新商店失败:', error);
      ElMessage.error(error.message || '刷新商店失败');
      throw error;
    } finally {
      gameState.value.loading = false;
    }
  }

  // 重置游戏状态
  const resetGameState = () => {
    gameState.value = {
      coins: 3,
      tavernTier: 1,
      maxTavernTier: 6,
      turn: 1,
      phase: 'preparation',
      shopMinions: [],
      handCards: [],
      board: {},
      players: [],
      currentPlayer: null,
      hero: null,
      loading: false
    }
  }

  // 升级酒馆
  const upgradeTavern = async () => {
    const cost = getUpgradeCost(gameState.value.tavernTier)
    if (gameState.value.coins >= cost) {
      wsService.emit('game:upgradeTavern')
    }
  }

  // 获取升级费用
  const getUpgradeCost = (currentTier) => {
    const costs = [0, 5, 7, 8, 9, 10]
    return costs[currentTier - 1] || 0
  }

  // 更新游戏状态
  const updateGameState = (newState) => {
    gameState.value = {
      ...gameState.value,
      ...newState
    }
  }

  // 开始新回合
  const startNewTurn = (data) => {
    const { coins, shopCards, turn } = data
    gameState.value = {
      ...gameState.value,
      coins,
      shopCards,
      turn,
      phase: 'preparation'
    }
  }

  // 开始战斗
  const startCombat = (data) => {
    gameState.value.phase = 'combat'
    // 可以添加其他战斗相关的状态更新
  }

  // 结束战斗
  const endCombat = (data) => {
    const { damages, eliminations } = data
    
    // 更新玩家生命值和淘汰状态
    gameState.value.players = gameState.value.players.map(player => {
      const damage = damages[player.userId] || 0
      return {
        ...player,
        health: Math.max(0, player.health - damage),
        eliminated: eliminations.includes(player.userId)
      }
    })
  }

  // 移动随从
  const moveMinion = (minionId, position) => {
    wsService.emit('game:moveMinion', { minionId, position })
  }

  // 冻结/解冻商店
  const toggleShopFreeze = () => {
    wsService.emit('game:toggleShopFreeze')
  }

  // 初始化游戏事件监听
  const initializeGameEvents = () => {
    console.log('🎮 初始化游戏事件监听');

    // 游戏开始
    wsService.socket.on('gameStarted', (data) => {
      console.log('🎮 游戏开始:', data);
      updateGameState({
        phase: data.phase,
        turn: data.turn
      });
      ElMessage.success('游戏开始!');
    });

    // 准备阶段开始
    wsService.socket.on('preparationPhaseStarted', () => {
      console.log('🔄 准备阶段开始');
      updateGameState({ phase: 'preparation' });
      ElMessage.info('准备阶段开始 (30秒)');
    });

    // 战斗阶段开始
    wsService.socket.on('combatPhaseStarted', () => {
      console.log('⚔️ 战斗阶段开始');
      updateGameState({ phase: 'combat' });
      ElMessage.info('战斗阶段开始');
    });

    // 回合开始
    wsService.socket.on('turnStarted', (data) => {
      console.log('🎲 回合开始:', data);
      updateGameState({
        coins: data.coins,
        shopMinions: data.shopMinions,
        turn: data.turn,
        phase: 'preparation'
      });
      ElMessage.success(`第 ${data.turn} 回合开始`);
    });

    // 战斗结果
    wsService.socket.on('battleResult', (data) => {
      console.log('🏆 战斗结果:', data);
      const { winner, loser, damage } = data;
      
      if (winner && loser) {
        ElMessage.info(`${winner.username} 击败了 ${loser.username}, 造成 ${damage} 点伤害`);
      }
    });

    // 游戏结束
    wsService.socket.on('gameEnded', (data) => {
      console.log('🏁 游戏结束:', data);
      updateGameState({ phase: 'finished' });
      
      if (data.winner) {
        ElMessage.success(`游戏结束! 胜利者: ${data.username}`);
      }
    });
  };

  // 清理游戏事件监听
  const cleanupGameEvents = () => {
    console.log('🧹 清理游戏事件监听');
    
    const events = [
      'gameStarted',
      'preparationPhaseStarted',
      'combatPhaseStarted',
      'turnStarted',
      'battleResult',
      'gameEnded'
    ];

    events.forEach(event => {
      wsService.socket.off(event);
    });
  };

  return {
    gameState,
    initializeGame,
    buyMinion,
    placeMinion,
    useHeroPower,
    refreshShop,
    resetGameState,
    upgradeTavern,
    updateGameState,
    startNewTurn,
    startCombat,
    endCombat,
    moveMinion,
    toggleShopFreeze,
    getUpgradeCost,
    initializeGameEvents,
    cleanupGameEvents
  }
}) 