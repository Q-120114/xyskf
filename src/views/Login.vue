<template>
  <div class="login-wrap">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="40" color="#409eff"><House /></el-icon>
        <h1>社区养老服务与健康监测平台</h1>
        <p>智慧养老 · 健康守护 · 安心服务</p>
      </div>
      <el-form :model="form" label-position="top" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="login">登 录</el-button>
      </el-form>
  
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../api'
import { useAuthStore } from '../store'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: '123456',
  role: '超级管理员'
})

async function login() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await authApi.login({ username: form.username, password: form.password })
    authStore.login(res.token, res.user)
    ElMessage.success('登录成功，欢迎 ' + res.user.realName)
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}
.login-box {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
}
.login-header h1 {
  font-size: 22px;
  margin: 12px 0 6px;
  color: #303133;
}
.login-header p {
  color: #909399;
  font-size: 13px;
  margin: 0;
}
.tips {
  margin-top: 20px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}
.tips p {
  margin: 4px 0;
}
</style>
