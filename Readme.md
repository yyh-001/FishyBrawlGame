让我为这个项目生成一个 README 文档：

```markdown:README.md
# Fishy Brawl - 在线卡牌对战游戏

Fishy Brawl 是一款轻便的多人在线类酒馆战旗的对战游戏，旨在为玩家提供随时随地、爽快的对战体验。

## 功能特点

- 🎮 快速匹配，随时开战
- 🃏 简单易上手的战旗玩法
- 👥 丰富多样的种族角色
- 🌈 独特的主题对战场景
- 📱 响应式设计，支持移动端
- 🌙 支持明暗主题切换

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Vite - 下一代前端构建工具
- Pinia - Vue 状态管理库
- Vue Router - Vue 官方路由
- Element Plus - Vue 3 UI 组件库
- TailwindCSS - 实用优先的 CSS 框架
- Axios - 基于 Promise 的 HTTP 客户端
- SCSS - CSS 预处理器

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
├── api/          # API 请求
├── assets/       # 静态资源
├── components/   # 组件
├── router/       # 路由配置
├── stores/       # Pinia 状态管理
├── views/        # 页面视图
└── App.vue       # 根组件
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

- 项目维护者：[Your Name]
- Email：[your-email@example.com]

## 致谢

感谢所有为这个项目做出贡献的开发者！
```

