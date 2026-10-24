<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="logo">
        <el-icon :size="24" color="#fff"><House /></el-icon>
        <span v-show="!collapsed" class="logo-text">智慧养老平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        router
        background-color="#001529"
        text-color="#b7c0cd"
        active-text-color="#409eff"
        class="menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle" @click="collapsed = !collapsed"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip content="未处置告警">
            <el-badge :value="pendingAlertCount" :hidden="pendingAlertCount === 0" class="alert-badge">
              <el-button circle size="small" @click="$router.push('/alert')">
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-badge>
          </el-tooltip>
          <el-dropdown>
            <div class="user">
              <el-avatar :size="30" size="small">{{ (currentUser.realName || 'U').charAt(0) }}</el-avatar>
              <span class="username">{{ currentUser.realName || currentUser.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>{{ currentUser.role }}</el-dropdown-item>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { alertsApi } from '../api'
import { useAuthStore } from '../store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(window.innerWidth < 768)
const currentUser = computed(() => authStore.user || {})
const pendingAlertCount = ref(0)

const menuItems = [
  { path: '/dashboard', title: '可视化大屏中心', icon: 'DataBoard' },
  { path: '/elderly', title: '老人档案管理', icon: 'User' },
  { path: '/health', title: '健康监测', icon: 'Monitor' },
  { path: '/service', title: '服务需求工单', icon: 'Tickets' },
  { path: '/alert', title: '紧急告警处置', icon: 'Bell' },
  { path: '/staff', title: '人员与响应监控', icon: 'UserFilled' },
  { path: '/statistics', title: '统计分析报表', icon: 'TrendCharts' },
  { path: '/system', title: '系统权限管理', icon: 'Setting' }
]

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '首页')

function handleResize() {
  collapsed.value = window.innerWidth < 768
}

async function loadPending() {
  try {
    const list = await alertsApi.list({ status: '待处置' })
    pendingAlertCount.value = list.length
  } catch (e) { /* ignore */ }
}
onMounted(() => {
  loadPending()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background: #001529;
  transition: width 0.25s;
  overflow: hidden;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  background: #002140;
}
.logo-text {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.menu {
  border-right: none;
  height: calc(100vh - 60px);
}
.menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.toggle {
  font-size: 20px;
  cursor: pointer;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.alert-badge {
  margin-right: 8px;
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
}
@media (max-width: 768px) {
  .username { display: none; }
  .el-breadcrumb { display: none; }
  .header-right { gap: 8px; }
}
.main {
  background: #f0f2f5;
  padding: 0;
  overflow-y: auto;
}
</style>
