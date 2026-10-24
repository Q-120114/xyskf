/**
 * Axios 请求封装
 * - 统一 baseURL（支持环境变量配置生产地址）
 * - 请求拦截：自动注入 Bearer Token
 * - 响应拦截：统一解包 res.data，401 自动登出并跳转登录页
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAuthStore } from '../store'

// 创建 axios 实例，生产环境通过 VITE_API_BASE_URL 配置后端地址
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

// 请求拦截器：从 Pinia store 读取 token 并注入 Authorization 头
http.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) config.headers.Authorization = `Bearer ${authStore.token}`
  return config
})

// 响应拦截器：成功时返回 data 层；失败时统一错误处理
http.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response) {
      const { status, data } = err.response
      if (status === 401) {
        // 401 未授权：清除登录态并跳转登录页
        const authStore = useAuthStore()
        authStore.logout()
        ElMessage.error(data?.message || '登录已过期，请重新登录')
        router.push('/login')
      } else {
        ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络异常，请检查后端服务是否启动')
    }
    return Promise.reject(err)
  }
)

export default http

// ===== API =====
export const authApi = {
  login: (data) => http.post('/auth/login', data),
  register: (data) => http.post('/auth/register', data),
  me: () => http.get('/auth/me')
}

export const elderlyApi = {
  list: (params) => http.get('/elderly', { params }),
  detail: (id) => http.get(`/elderly/${id}`),
  create: (data) => http.post('/elderly', data),
  update: (id, data) => http.put(`/elderly/${id}`, data),
  remove: (id) => http.delete(`/elderly/${id}`)
}

export const healthApi = {
  list: (params) => http.get('/health', { params }),
  trend: (id) => http.get(`/health/trend/${id}`),
  setThreshold: (data) => http.post('/health/threshold', data)
}

export const ordersApi = {
  list: (params) => http.get('/orders', { params }),
  create: (data) => http.post('/orders', data),
  dispatch: (id, assignee) => http.put(`/orders/${id}/dispatch`, { assignee }),
  complete: (id) => http.put(`/orders/${id}/complete`)
}

export const alertsApi = {
  list: (params) => http.get('/alerts', { params }),
  handle: (id, data) => http.put(`/alerts/${id}/handle`, data)
}

export const staffApi = {
  list: () => http.get('/staff'),
  detail: (id) => http.get(`/staff/${id}`)
}

export const statsApi = {
  dashboard: () => http.get('/stats/dashboard'),
  chronic: () => http.get('/stats/chronic'),
  serviceTypes: () => http.get('/stats/service-types'),
  alertTypes: () => http.get('/stats/alert-types'),
  areas: () => http.get('/stats/areas'),
  monthlyTrend: () => http.get('/stats/monthly-trend'),
  weeklyResponse: () => http.get('/stats/weekly-response')
}

export const systemApi = {
  users: () => http.get('/system/users'),
  createUser: (data) => http.post('/system/users', data),
  toggleUser: (id) => http.put(`/system/users/${id}/toggle`),
  devices: () => http.get('/system/devices'),
  logs: () => http.get('/system/logs')
}
