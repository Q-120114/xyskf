import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../store'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '可视化大屏中心', icon: 'DataBoard' }
      },
      {
        path: 'elderly',
        name: 'Elderly',
        component: () => import('../views/Elderly.vue'),
        meta: { title: '老人档案管理', icon: 'User' }
      },
      {
        path: 'health',
        name: 'Health',
        component: () => import('../views/Health.vue'),
        meta: { title: '健康监测', icon: 'Monitor' }
      },
      {
        path: 'service',
        name: 'Service',
        component: () => import('../views/Service.vue'),
        meta: { title: '服务需求工单', icon: 'Tickets' }
      },
      {
        path: 'alert',
        name: 'Alert',
        component: () => import('../views/Alert.vue'),
        meta: { title: '紧急告警处置', icon: 'Bell' }
      },
      {
        path: 'staff',
        name: 'Staff',
        component: () => import('../views/Staff.vue'),
        meta: { title: '人员与响应监控', icon: 'UserFilled' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue'),
        meta: { title: '统计分析报表', icon: 'TrendCharts' }
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('../views/System.vue'),
        meta: { title: '系统权限管理', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.path === '/login') {
    if (authStore.token) next('/dashboard')
    else next()
  } else {
    if (authStore.token) next()
    else next('/login')
  }
})

export default router
