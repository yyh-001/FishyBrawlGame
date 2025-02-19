# Fishy Brawl - 在线卡牌对战游戏

Fishy Brawl 是一款轻便的炉石酒馆战旗的对战游戏，旨在为玩家提供随时随地、爽快的对战体验。

## 功能特点

- 🎮 快速匹配，随时开战
- 🃏 简单易上手的战旗玩法
- 👥 丰富多样的种族角色
- 🌈 独特的主题对战场景
- 📱 响应式设计，支持移动端
- 🌙 支持明暗主题切换
- 🎮 支持多人在线对战

## 技术栈

- ✅ Vue 3 - 渐进式 JavaScript 框架
- ✅ Vite - 下一代前端构建工具
- ✅ Pinia - Vue 状态管理库
- ✅ Vue Router - Vue 官方路由
- ✅ Element Plus - Vue 3 UI 组件库
- ✅ TailwindCSS - 实用优先的 CSS 框架
- ✅ Socket.IO - WebSocket 客户端
- ✅ SCSS - CSS 预处理器

## 已实现功能

### 1. 用户系统
- ✅ 用户认证
  - ✅ 登录/注册
  - ✅ 邮箱验证
  - ✅ 找回密码
  - ✅ 修改密码
  - ✅ Token 管理

### 2. 大厅系统
- ✅ 房间管理
  - ✅ 创建房间
  - ✅ 加入房间
  - ✅ 房间列表
  - ✅ 房间状态同步
  
- ✅ 匹配系统
  - ✅ 快速匹配
  - ✅ 匹配状态显示
  - ✅ 匹配取消

### 3. 社交系统
- ✅ 好友系统
  - ✅ 好友列表
  - ✅ 添加好友
  - ✅ 好友请求
  - ✅ 删除好友
  - ✅ 在线状态

### 4. 游戏界面
- ✅ 英雄选择
  - ✅ 英雄列表展示
  - ✅ 英雄选择确认
  - ✅ 选择倒计时
  
- 🚧 对战界面
  - ✅ 基础布局
  - 🚧 商店系统
  - 🚧 随从展示
  - 🚧 战斗动画

## 待实现功能

### 1. 游戏核心功能
- 🚧 商店系统
  - 🚧 随从商店
  - 🚧 刷新机制
  - 🚧 购买/出售
  - 🚧 冻结功能
  
- 🚧 战斗系统
  - 🚧 随从放置
  - 🚧 战斗动画
  - 🚧 伤害计算
  - 🚧 战斗结果
  
- 🚧 英雄系统
  - 🚧 英雄技能
  - 🚧 技能动画
  - 🚧 技能效果

### 2. UI/UX 优化
- 🚧 游戏动画
  - 🚧 随从移动动画
  - 🚧 战斗特效
  - 🚧 技能特效
  - 🚧 升级特效
  
- 🚧 界面优化
  - 🚧 加载动画
  - 🚧 过渡效果
  - 🚧 响应式适配
  - 🚧 触摸操作优化

### 3. 社交功能增强
- 🚧 聊天系统
  - 🚧 全局聊天
  - 🚧 好友私聊
  - 🚧 房间聊天
  - 🚧 表情系统
  
- 🚧 观战系统
  - 🚧 实时观战
  - 🚧 战斗回放
  - 🚧 观战邀请

### 4. 数据展示
- 🚧 个人中心
  - 🚧 战绩统计
  - 🚧 英雄数据
  - 🚧 随从统计
  - 🚧 成就系统
  
- 🚧 排行榜
  - 🚧 全球排名
  - 🚧 好友排名
  - 🚧 赛季排名

### 5. 系统优化
- 🚧 性能优化
  - 🚧 资源预加载
  - 🚧 状态管理优化
  - 🚧 渲染性能优化
  
- 🚧 网络优化
  - 🚧 断线重连
  - 🚧 状态同步
  - 🚧 网络延迟处理

## 开发环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

## 项目设置

1. 克隆项目
```bash
git clone [repository-url]
cd fishy-brawl
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
├── api/ # API 请求封装
├── assets/ # 静态资源
│ ├── icons/ # 图标资源
│ ├── images/ # 图片资源
│ └── styles/ # 样式文件
├── components/ # 公共组件
│ ├── common/ # 通用组件
│ ├── game/ # 游戏相关组件
│ ├── friend/ # 好友相关组件
│ └── layout/ # 布局组件
├── composables/ # 组合式函数
├── directives/ # 自定义指令
├── router/ # 路由配置
├── services/ # 服务封装
├── stores/ # 状态管理
├── types/ # 类型定义
├── utils/ # 工具函数
└── views/ # 页面视图
├── auth/ # 认证相关页面
├── game/ # 游戏相关页面
└── user/ # 用户相关页面
```

## 主要功能

- 用户认证
  - 登录
  - 注册
  - 找回密码
  - 修改密码
- 对战系统
  - 快速匹配
  - 实时对战
  - 积分系统
- 个人中心
  - 对战记录
  - 数据统计
  - 主题切换

## 环境变量

创建 `.env` 文件并配置以下环境变量：

```
VITE_API_BASE_URL=your-api-base-url
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT License](LICENSE)

## 联系方式

- 项目维护者：yyh
- Email：[1807875605@qq.com]

## 致谢

感谢所有为这个项目做出贡献的开发者！

