import { defineStore } from 'pinia'
import { ref } from 'vue'
import { wsService } from '@/services/websocket'
import { ElMessage } from 'element-plus'
import { GAME_CONFIG } from '@/config/gameConfig'

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const gameState = ref({
    coins: GAME_CONFIG.INITIAL_COINS,
    tavernTier: GAME_CONFIG.INITIAL_TAVERN_TIER,
    maxTavernTier: GAME_CONFIG.MAX_TAVERN_TIER,
    turn: 1,
    phase: 'preparation', // preparation | combat
    shopMinions: [], // 商店随从
    handCards: [],
    board: {},
    players: [],
    currentPlayer: null,
    hero: null,
    loading: false,
    timeRemaining: GAME_CONFIG.TIME_LIMITS.HERO_SELECTION
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

      if (gameState.value.phase !== GAME_CONFIG.PHASES.PREPARATION) {
        throw new Error('当前不是准备阶段');
      }

      if (gameState.value.coins < GAME_CONFIG.REFRESH_COST) {
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
          minions: gameState.value.shopMinions,
          remainingCoins: gameState.value.coins
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
      coins: GAME_CONFIG.INITIAL_COINS,
      tavernTier: GAME_CONFIG.INITIAL_TAVERN_TIER,
      maxTavernTier: GAME_CONFIG.MAX_TAVERN_TIER,
      turn: 1,
      phase: 'preparation',
      shopMinions: [],
      handCards: [],
      board: {},
      players: [],
      currentPlayer: null,
      hero: null,
      loading: false,
      timeRemaining: GAME_CONFIG.TIME_LIMITS.HERO_SELECTION
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
    console.log('更新游戏状态:', {
      current: gameState.value,
      new: newState
    });
    
    gameState.value = {
      ...gameState.value,
      ...newState
    };
    
    console.log('更新后的状态:', gameState.value);
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

  // 开始英雄选择
  const startHeroSelection = () => {
    gameState.value.phase = 'hero_selection';
    gameState.value.timeRemaining = GAME_CONFIG.TIME_LIMITS.HERO_SELECTION;

    // 开始倒计时
    const timer = setInterval(() => {
        if (gameState.value.timeRemaining > 0) {
            gameState.value.timeRemaining--;
        } else {
            clearInterval(timer);
            // 时间到，处理未选择的情况
            handleHeroSelectionTimeout();
        }
    }, 1000);
  }

  // 初始化游戏事件监听
  const initializeGameEvents = () => {
    console.log('🎮 初始化游戏事件监听');

    // 游戏开始
    wsService.socket.on('gameStarted', (data) => {
      console.log('🎮 游戏开始:', data);
      updateGameState({
        phase: data.phase,
        turn: data.turn,
        coins: data.coins, // 确保更新金币
        health: data.health,
        tavernTier: data.tavernTier,
        shopMinions: data.shopMinions
      });
      ElMessage.success('游戏开始!');
    });

    // 准备阶段开始
    wsService.socket.on('preparationPhaseStarted', (data) => {
      console.log('🔄 准备阶段开始:', data);
      updateGameState({ 
        phase: 'preparation',
        coins: data.coins, // 确保更新金币
        shopMinions: data.shopMinions,
        turn: data.turn
      });
      ElMessage.info('准备阶段开始 (30秒)');
    });

    // 刷新商店响应处理
    wsService.socket.on('shopRefreshed', (data) => {
      console.log('🏪 商店刷新响应:', data);
      if (data.success) {
        updateGameState({
          shopMinions: data.data.minions,
          coins: data.data.remainingCoins // 确保更新剩余金币
        });
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
    cleanupGameEvents,
    startHeroSelection
  }
}) 