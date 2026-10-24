# 社区养老服务与健康监测可视化系统

面向社区养老场景的一站式可视化管理平台，覆盖老人档案、健康监测、服务工单、紧急告警、人员调度、统计分析、系统管理七大核心业务，提供大屏可视化、实时数据联动与多角色权限管控。

## 功能模块

| 模块 | 说明 |
|---|---|
| 可视化大屏中心 | 社区地图总览、健康看板、服务需求、紧急事件、人员响应、重点人群、月度趋势 |
| 老人档案管理 | 老人信息 CRUD、按片区/楼栋/照护等级筛选、详情抽屉、重点关爱标识 |
| 健康监测 | 实时体征看板（心率/血压/血氧/血糖/体温/步数/睡眠）、趋势分析、异常高亮 |
| 服务需求工单 | 工单全生命周期（新建→派单→接单→上门→完成→评价）、状态筛选、详情下钻 |
| 紧急告警处置 | 告警台账、级别/状态筛选、处置流转、告警类型分布、实时告警流 |
| 人员与响应监控 | 人员在岗状态、实时定位、响应时长统计、绩效考核排行、一键呼叫模拟 |
| 统计分析报表 | 多维度统计（片区/照护/服务/告警）、趋势预测、导出 Excel、打印报表 |
| 系统权限管理 | 角色权限、用户管理、设备管理、操作日志 |

## 技术栈

**前端**
- Vue 3.5（Composition API + `<script setup>`）
- Vite 8 构建工具
- Vue Router 4（Hash 路由 + 全局守卫）
- Pinia 4（状态管理，认证状态集中管理 + localStorage 持久化）
- Element Plus 2.14（UI 组件库，中文语言包）
- ECharts 6 + vue-echarts 8（按需引入，15+ 图表）
- Axios 1.20（请求封装 + 拦截器 + Token 自动注入 + 401 自动登出）

**后端**
- Node.js + Express 5
- MySQL 8.0（mysql2 连接池）
- JWT 身份认证 + bcryptjs 密码加密
- CORS 跨域支持

## 项目结构

```
ksszy/
├── src/                      # 前端源码
│   ├── api/index.js          # Axios 封装与接口定义
│   ├── router/index.js       # 路由表 + 权限守卫
│   ├── store/index.js        # Pinia 认证 Store
│   ├── utils/chartOptions.js # 图表配置工具函数
│   ├── layout/MainLayout.vue # 主布局（侧边栏 + 顶栏）
│   ├── views/                # 9 个业务页面
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── Elderly.vue
│   │   ├── Health.vue
│   │   ├── Service.vue
│   │   ├── Alert.vue
│   │   ├── Staff.vue
│   │   ├── Statistics.vue
│   │   └── System.vue
│   ├── constants.js          # 业务常量
│   ├── style.css             # 全局样式
│   ├── App.vue
│   └── main.js               # 入口（注册 Pinia/Element/ECharts/Router）
├── server/                   # 后端源码
│   ├── index.js              # Express 入口
│   ├── config.js             # MySQL 配置
│   ├── db.js                 # 数据库初始化 + 种子数据
│   └── routes/               # 8 个路由模块
│       ├── auth.js           # 登录认证
│       ├── elderly.js        # 老人档案
│       ├── health.js         # 健康监测
│       ├── orders.js         # 服务工单
│       ├── alerts.js         # 紧急告警
│       ├── staff.js          # 人员管理
│       ├── stats.js          # 统计聚合
│       └── system.js         # 系统管理
├── .env.production           # 生产环境变量
├── vite.config.js            # Vite 配置（代理 + 构建分包）
└── package.json
```

## 运行指南

### 环境要求
- Node.js ≥ 18
- MySQL 8.0

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

编辑 `server/config.js`，确认 MySQL 连接信息（默认 root / 123456，数据库 `elderly_care` 会自动创建）。

### 3. 启动后端

```bash
node server/index.js
```

后端启动后自动建库、建表并灌入种子数据（128 位老人、健康数据、工单、告警、人员、设备、日志），服务运行于 `http://localhost:5000`。

### 4. 启动前端

```bash
npm run dev
```

前端运行于 `http://localhost:5173`，Vite 代理 `/api` 至后端。

### 5. 默认账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| admin | 123456 | 超级管理员 |
| manager | 123456 | 片区管理员 |
| grid | 123456 | 网格员 |
| nurse | 123456 | 护理员 |
| family | 123456 | 家属 |

## 部署说明

### 前端构建

```bash
npm run build
```

产物输出至 `dist/`，使用相对路径（`base: './'`），可部署至任意子路径。

### 生产环境配置

编辑 `.env.production`，将 `VITE_API_BASE_URL` 改为后端服务的真实访问地址：

```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### 部署方式

**静态托管（Gitee Pages / GitHub Pages / Nginx）**
1. 执行 `npm run build` 生成 `dist/`
2. 将 `dist/` 内容上传至静态托管平台
3. 因使用 Hash 路由，无需额外的服务端路由配置

**后端部署**
1. 安装 Node.js ≥ 18 与 MySQL 8.0
2. 上传 `server/` 目录
3. 执行 `npm install` 安装后端依赖（express、mysql2、cors、jsonwebtoken、bcryptjs）
4. 配置 `server/config.js` 中的数据库连接
5. 运行 `node server/index.js`，建议使用 pm2 守护进程

## 构建性能

| Chunk | 大小 | gzip |
|---|---|---|
| vue (vue+router+pinia) | 30.8 kB | 12.1 kB |
| echarts（按需引入） | 745 kB | 255 kB |
| element-plus | 1,067 kB | 330 kB |
| 业务主包 | 6.0 kB | 2.7 kB |

Vendor 依赖独立分包，便于浏览器缓存与二次加载加速。
