# 系统设计文档

## 一、系统架构

### 1.1 总体架构

系统采用前后端分离的 B/S 架构，前端 SPA 与后端 RESTful API 通过 HTTP 通信。

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器（客户端）                        │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Vue 3 视图层 │  │ Pinia 状态│  │ 路由守卫  │  │ Axios 请求│  │
│  │ (9 个页面)   │  │ (认证)    │  │ (JWT鉴权) │  │ (拦截器)  │  │
│  └─────────────┘  └──────────┘  └──────────┘  └────┬─────┘  │
└────────────────────────────────────────────────────┼─────────┘
                                                     │ HTTP/JSON
                                                     │ (Bearer Token)
┌────────────────────────────────────────────────────┼─────────┐
│                    Node.js 后端                       │         │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌────▼─────┐  │
│  │  Express 路由 │  │ JWT 鉴权 │  │ bcrypt   │  │ 业务逻辑  │  │
│  │  (8 个模块)   │  │ 中间件   │  │ 密码加密 │  │ (CRUD)   │  │
│  └─────────────┘  └──────────┘  └──────────┘  └────┬─────┘  │
└────────────────────────────────────────────────────┼─────────┘
                                                     │ SQL
┌────────────────────────────────────────────────────┼─────────┐
│                    MySQL 8.0 数据库                  │         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │         │
│  │ users    │ │ elderly  │ │health  │ │ orders │  │         │
│  └──────────┘ └──────────┘ └────────┘ └────────┘  │         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │         │
│  │ alerts   │ │ staff    │ │devices │ │ logs   │  │         │
│  └──────────┘ └──────────┘ └────────┘ └────────┘  │         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术分层

| 层级 | 技术选型 | 职责 |
|---|---|---|
| 表现层 | Vue 3 + Element Plus | 页面渲染、用户交互、表单校验 |
| 状态层 | Pinia | 认证状态集中管理、持久化 |
| 路由层 | Vue Router 4 | 页面导航、权限守卫、懒加载 |
| 网络层 | Axios | 请求封装、Token 注入、统一错误处理 |
| 服务层 | Express 5 | RESTful API、业务逻辑、数据聚合 |
| 数据层 | MySQL 8.0 + mysql2 | 数据持久化、连接池 |
| 安全层 | JWT + bcryptjs | 身份认证、密码哈希 |

## 二、组件结构图

### 2.1 前端组件树

```
App.vue
└── router-view
    ├── Login.vue（独立页面，无布局）
    └── MainLayout.vue（主布局）
        ├── el-aside（侧边栏）
        │   ├── logo
        │   └── el-menu（8 个导航项，router 模式）
        ├── el-header（顶栏）
        │   ├── 折叠按钮
        │   ├── 面包屑
        │   ├── 告警提醒（el-badge）
        │   └── 用户下拉菜单
        └── el-main > router-view
            ├── Dashboard.vue（6 图表 + 地图）
            ├── Elderly.vue（表格 + 筛选 + 抽屉）
            ├── Health.vue（看板 + 列表 + 趋势）
            ├── Service.vue（统计 + 表格 + 弹窗）
            ├── Alert.vue（表格 + 饼图 + 处置流）
            ├── Staff.vue（地图 + 列表 + 排行）
            ├── Statistics.vue（7 图表 + 报表 + 导出）
            └── System.vue（4 Tab：角色/用户/设备/日志）
```

### 2.2 后端路由模块

| 路由前缀 | 模块 | 核心接口 |
|---|---|---|
| `/api/auth` | 认证 | `POST /login`（登录返回 JWT） |
| `/api/elderly` | 老人档案 | `GET /`（列表+筛选）、`GET /:id`、`POST /`、`PUT /:id`、`DELETE /:id` |
| `/api/health` | 健康监测 | `GET /`（体征列表）、`GET /:id/trend`（趋势） |
| `/api/orders` | 服务工单 | `GET /`、`POST /`、`PUT /:id/status`（状态流转） |
| `/api/alerts` | 紧急告警 | `GET /`（级别/状态筛选）、`PUT /:id/handle`（处置） |
| `/api/staff` | 人员 | `GET /`、`PUT /:id/location`（定位更新） |
| `/api/stats` | 统计 | `dashboard`、`chronic`、`serviceTypes`、`alertTypes`、`areas`、`monthlyTrend` |
| `/api/system` | 系统 | `users`、`devices`、`logs` |

## 三、数据流设计

### 3.1 认证数据流（登录 → 鉴权 → 登出）

```
用户输入账号密码
      │
      ▼
Login.vue ──POST /api/auth/login──▶ 后端
      │                                │
      │                          校验账号 + bcrypt 比对
      │                                │
      │◀───── { token, user } ─────────┘
      │
authStore.login(token, user)
      │
      ├─▶ state.token / state.user 更新
      ├─▶ localStorage 持久化
      └─▶ router.push('/dashboard')
```

**鉴权流程（每次请求）：**

```
组件调用 API
      │
      ▼
Axios 请求拦截器 ──▶ authStore.token 存在？
      │                         │
      │ 是                      │ 否
      ▼                         ▼
  注入 Bearer Token      直接发送（可能 401）
      │
      ▼
后端 JWT 中间件校验 ──▶ 有效？放行 / 无效返回 401
      │
      ▼
Axios 响应拦截器 ──▶ 401？authStore.logout() + 跳转 /login
```

### 3.2 数据加载流（以 Dashboard 为例）

```
Dashboard.vue onMounted
      │
      ▼
Promise.all([
  statsApi.dashboard(),      // 顶部统计卡片
  elderlyApi.list(),          // 老人列表（重点人群计算）
  healthApi.list(),           // 健康数据（异常统计）
  ordersApi.list(),           // 工单（状态统计）
  alertsApi.list(),           // 告警（高危/今日统计）
  staffApi.list(),            // 人员（响应排行）
  systemApi.devices(),        // 设备（离线统计）
  statsApi.chronic(),         // 慢病分布
  statsApi.serviceTypes(),    // 服务需求
  statsApi.alertTypes(),      // 告警类型
  statsApi.monthlyTrend()     // 月度趋势
])
      │
      ▼
ref 赋值 ──▶ computed 图表 option 自动更新 ──▶ ECharts 重渲染
```

### 3.3 图表数据映射

后端返回 snake_case 字段 → 路由层 `mapXxx()` 函数转换为 camelCase → 前端 `computed` 将业务数据映射为 ECharts option。

示例（老人照护等级饼图）：

```
elderly 列表 (careLevel: '自理'/'半失能'/'失能')
      │
      ▼
computed: 遍历统计各等级人数
      │
      ▼
pieOption({ data: [{name:'自理', value: N}, ...] })
      │
      ▼
ECharts 渲染
```

## 四、数据库设计

### 4.1 表结构概览

| 表名 | 说明 | 核心字段 |
|---|---|---|
| users | 系统用户 | id, username, password(bcrypt), real_name, role, area, phone, active, last_login |
| elderly | 老人档案 | id, name, gender, age, phone, address, area, building, room, care_level, diseases(JSON), tags(JSON), services(JSON), is_key, bind_device, device_type |
| health_data | 健康体征 | id(=elderly_id), hr, sbp, dbp, spo2, bg, temp, steps, sleep, in_bed, device_online, abnormal, risk_level, last_update |
| orders | 服务工单 | id, elderly_id, elderly_name, service_type, status, priority, address, phone, assignee, created_at, completed_at |
| alerts | 紧急告警 | id, elderly_id, elderly_name, level, type, area, source, status, time, assignee, response_min |
| staff | 服务人员 | id, name, role, area, phone, skills(JSON), online, rating, pending_orders, completed_today, avg_response |
| devices | 设备 | id, type, elderly_id, elderly_name, area, status, last_online |
| system_logs | 操作日志 | id, user, action, time, ip |

### 4.2 关键字段约定

- 所有表使用 `utf8mb4` 字符集，`InnoDB` 引擎
- JSON 数组字段（diseases、tags、services、skills）以 TEXT 存储，路由层 `JSON.parse` 解析
- 布尔字段（is_key、bind_device、in_bed、device_online、abnormal、online、active）使用 TINYINT，路由层转换为 Boolean
- 时间字段使用 DATETIME，路由层转换为 camelCase（createdAt、lastLogin 等）

## 五、关键设计决策

### 5.1 状态管理：Pinia 集中认证

将原先散落在 4 个文件中的 `localStorage` 操作收敛到 `useAuthStore`，统一管理 `token` 与 `user`，提供 `login`/`logout` actions 与 `isLoggedIn` 等 getters。组件、路由守卫、请求拦截器均通过 store 访问认证状态，避免直接操作 `localStorage`。

### 5.2 图表配置复用

抽取 `src/utils/chartOptions.js`，封装 `barOption`、`pieOption`、`lineOption`、`axisGrid` 等通用配置函数，消除 5 个页面中 50+ 处重复的 `tooltip`/`grid`/`itemStyle` 配置，提升可维护性。

### 5.3 构建分包

Vite `manualChunks` 将 vue、element-plus、echarts 拆分为独立 chunk，主包从 1.5MB 降至 6KB，vendor 独立缓存加速二次加载。

### 5.4 响应式设计

侧边栏监听 `window.resize`，窗口 < 768px 自动折叠为图标模式；表格列使用 Element Plus 自动横向滚动；统计卡片使用 CSS Grid `auto-fit` 自适应列数。
