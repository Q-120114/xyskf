/**
 * 认证状态 Store
 * 集中管理用户登录态（token + 用户信息），通过 localStorage 持久化。
 * 组件、路由守卫、请求拦截器均通过此 store 访问认证状态，避免散落的 localStorage 操作。
 */
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // JWT 令牌，从 localStorage 初始化，保证刷新后登录态不丢失
    token: localStorage.getItem('token') || '',
    // 当前登录用户信息（username, realName, role, area, phone）
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    /** 是否已登录 */
    isLoggedIn: (state) => !!state.token,
    /** 登录用户名 */
    username: (state) => state.user?.username || '',
    /** 用户真实姓名 */
    realName: (state) => state.user?.realName || '',
    /** 用户角色 */
    role: (state) => state.user?.role || '',
    /** 所属片区 */
    area: (state) => state.user?.area || ''
  },
  actions: {
    /**
     * 登录：保存 token 与用户信息，同时写入 localStorage 持久化
     * @param {string} token - JWT 令牌
     * @param {object} user - 用户信息对象
     */
    login(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    /** 退出登录：清除 token 与用户信息，同时移除 localStorage */
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
