// 游戏基础配置
export const GAME_CONFIG = {
  // 玩家初始状态
  INITIAL_COINS: 10,
  INITIAL_HEALTH: 40,
  INITIAL_TAVERN_TIER: 1,
  MAX_TAVERN_TIER: 6,

  // 商店相关
  REFRESH_COST: 1,
  MINION_PURCHASE_COST: 3,
  MINION_SELL_REFUND: 1,
  
  // 游戏阶段
  PHASES: {
    PREPARATION: 'preparation',
    COMBAT: 'combat'
  },

  // 时间限制(秒)
  TIME_LIMITS: {
    PREPARATION: 30,
    HERO_SELECTION: 20,
  },

  // 机器人配置
  BOT: {
    WAIT_TIME: 15000,
    MIN_RATING_VARIATION: -50,
    MAX_RATING_VARIATION: 50
  }
} 