<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统权限管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 角色权限 -->
      <el-tab-pane label="角色权限" name="role">
        <div class="card">
          <div style="margin-bottom:12px">
            <el-button type="primary"><el-icon><Plus /></el-icon>新增角色</el-button>
          </div>
          <el-table :data="roles" border stripe>
            <el-table-column prop="name" label="角色名称" width="140" />
            <el-table-column prop="desc" label="角色描述" />
            <el-table-column prop="userCount" label="用户数" width="80" align="center" />
            <el-table-column label="权限" width="320">
              <template #default="{ row }">
                <el-tag v-for="p in row.permissions" :key="p" size="small" style="margin:2px">{{ p }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch :model-value="row.enabled" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default>
                <el-button size="small">编辑权限</el-button>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="card" style="margin-top:12px">
          <h3 class="section-title">权限矩阵</h3>
          <el-table :data="permMatrix" border stripe>
            <el-table-column prop="module" label="功能模块" width="150" />
            <el-table-column label="超级管理员" align="center">
              <template #default="{ row }"><el-icon v-if="row.admin" color="#67c23a"><Check /></el-icon></template>
            </el-table-column>
            <el-table-column label="社区管理员" align="center">
              <template #default="{ row }"><el-icon v-if="row.manager" color="#67c23a"><Check /></el-icon><el-icon v-else color="#c0c4cc"><Close /></el-icon></template>
            </el-table-column>
            <el-table-column label="网格员" align="center">
              <template #default="{ row }"><el-icon v-if="row.grid" color="#67c23a"><Check /></el-icon><el-icon v-else color="#c0c4cc"><Close /></el-icon></template>
            </el-table-column>
            <el-table-column label="护理员" align="center">
              <template #default="{ row }"><el-icon v-if="row.nurse" color="#67c23a"><Check /></el-icon><el-icon v-else color="#c0c4cc"><Close /></el-icon></template>
            </el-table-column>
            <el-table-column label="家属" align="center">
              <template #default="{ row }"><el-icon v-if="row.family" color="#67c23a"><Check /></el-icon><el-icon v-else color="#c0c4cc"><Close /></el-icon></template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="user">
        <div class="card">
          <div style="margin-bottom:12px">
            <el-input v-model="userSearch" placeholder="搜索用户名" clearable style="width:200px;margin-right:12px" />
            <el-button type="primary"><el-icon><Plus /></el-icon>新增用户</el-button>
          </div>
          <el-table :data="users.filter(u => !userSearch || u.name.includes(userSearch))" border stripe>
            <el-table-column prop="name" label="用户名" width="120" />
            <el-table-column prop="realName" label="姓名" width="100" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="{ row }"><el-tag size="small">{{ row.role }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="area" label="所属片区" width="140" />
            <el-table-column prop="phone" label="联系方式" width="140" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.active ? 'success' : 'danger'" size="small">{{ row.active ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLogin" label="最后登录" width="160" />
            <el-table-column label="操作" width="160">
              <template #default>
                <el-button size="small">编辑</el-button>
                <el-button size="small" type="warning">重置密码</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 设备管理 -->
      <el-tab-pane label="设备管理" name="device">
        <div class="card">
          <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
            <div class="stat-card"><div class="stat-icon" style="background:#409eff"><el-icon><Cpu /></el-icon></div><div><div class="stat-value">{{ deviceList.length }}</div><div class="stat-label">设备总数</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#67c23a"><el-icon><Connection /></el-icon></div><div><div class="stat-value">{{ onlineDev }}</div><div class="stat-label">在线设备</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#f56c6c"><el-icon><Link /></el-icon></div><div><div class="stat-value">{{ offlineDev }}</div><div class="stat-label">离线设备</div></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#e6a23c"><el-icon><Battery /></el-icon></div><div><div class="stat-value">{{ lowBattery }}</div><div class="stat-label">低电量</div></div></div>
          </div>
          <el-table :data="deviceList" border stripe height="500">
            <el-table-column prop="id" label="设备编号" width="120" />
            <el-table-column prop="type" label="设备类型" width="140" />
            <el-table-column prop="elderlyName" label="绑定老人" width="100" />
            <el-table-column prop="elderlyId" label="老人编号" width="110" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '在线' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="电量" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.battery" :color="row.battery < 20 ? '#f56c6c' : row.battery < 50 ? '#e6a23c' : '#67c23a'" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column prop="lastOnline" label="最后在线" width="120" />
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button size="small">解绑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 基础字典 -->
      <el-tab-pane label="基础字典" name="dict">
        <div class="card">
          <el-row :gutter="16">
            <el-col :span="8">
              <h3 class="section-title">服务类型</h3>
              <el-table :data="dictService" border size="small">
                <el-table-column prop="code" label="编码" width="80" />
                <el-table-column prop="name" label="名称" />
              </el-table>
            </el-col>
            <el-col :span="8">
              <h3 class="section-title">疾病类型</h3>
              <el-table :data="dictDisease" border size="small">
                <el-table-column prop="code" label="编码" width="80" />
                <el-table-column prop="name" label="名称" />
              </el-table>
            </el-col>
            <el-col :span="8">
              <h3 class="section-title">告警类型</h3>
              <el-table :data="dictAlert" border size="small">
                <el-table-column prop="code" label="编码" width="80" />
                <el-table-column prop="name" label="名称" />
                <el-table-column prop="level" label="默认级别" width="90">
                  <template #default="{ row }"><el-tag size="small" :type="row.level==='高危'?'danger':row.level==='紧急'?'warning':'info'">{{ row.level }}</el-tag></template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top:16px">
            <el-col :span="8">
              <h3 class="section-title">自理等级</h3>
              <el-table :data="dictCare" border size="small">
                <el-table-column prop="code" label="编码" width="80" />
                <el-table-column prop="name" label="名称" />
              </el-table>
            </el-col>
            <el-col :span="8">
              <h3 class="section-title">优先级</h3>
              <el-table :data="dictPriority" border size="small">
                <el-table-column prop="code" label="编码" width="80" />
                <el-table-column prop="name" label="名称" />
              </el-table>
            </el-col>
            <el-col :span="8">
              <h3 class="section-title">片区</h3>
              <el-table :data="dictArea" border size="small">
                <el-table-column prop="code" label="编码" width="80" />
                <el-table-column prop="name" label="名称" />
              </el-table>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- 日志管理 -->
      <el-tab-pane label="日志管理" name="log">
        <div class="card">
          <div style="margin-bottom:12px">
            <el-input v-model="logSearch" placeholder="搜索操作人/动作" clearable style="width:240px" />
          </div>
          <el-table :data="logs.filter(l => !logSearch || l.user.includes(logSearch) || l.action.includes(logSearch))" border stripe height="500">
            <el-table-column prop="id" label="序号" width="70" />
            <el-table-column prop="user" label="操作人" width="100" />
            <el-table-column prop="action" label="操作动作" />
            <el-table-column prop="ip" label="IP地址" width="150" />
            <el-table-column prop="time" label="操作时间" width="180" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { systemApi } from '../api'
import { serviceTypes, chronicDiseases, alertTypes, careLevels, areas } from '../constants'

const activeTab = ref('role')
const userSearch = ref('')
const logSearch = ref('')
const users = ref([])
const deviceList = ref([])
const logs = ref([])

const roles = [
  { name: '超级管理员', desc: '拥有系统全部权限', userCount: 2, enabled: true, permissions: ['全部模块', '用户管理', '系统配置', '数据导出'] },
  { name: '社区管理员', desc: '社区养老业务管理', userCount: 5, enabled: true, permissions: ['老人档案', '工单管理', '告警处置', '统计报表'] },
  { name: '网格员', desc: '片区老人走访与录入', userCount: 12, enabled: true, permissions: ['老人档案', '工单录入', '告警上报'] },
  { name: '护理员', desc: '上门服务执行', userCount: 20, enabled: true, permissions: ['工单接单', '服务记录'] },
  { name: '家属', desc: '只读查看老人信息', userCount: 80, enabled: true, permissions: ['健康查看', '告警接收', '工单提交'] }
]

const permMatrix = [
  { module: '老人档案管理', admin: true, manager: true, grid: true, nurse: false, family: false },
  { module: '健康监测', admin: true, manager: true, grid: true, nurse: true, family: true },
  { module: '服务工单', admin: true, manager: true, grid: true, nurse: true, family: true },
  { module: '告警处置', admin: true, manager: true, grid: true, nurse: false, family: false },
  { module: '人员管理', admin: true, manager: true, grid: false, nurse: false, family: false },
  { module: '统计报表', admin: true, manager: true, grid: false, nurse: false, family: false },
  { module: '系统管理', admin: true, manager: false, grid: false, nurse: false, family: false }
]

onMounted(async () => {
  const [u, d, l] = await Promise.all([systemApi.users(), systemApi.devices(), systemApi.logs()])
  users.value = u
  deviceList.value = d
  logs.value = l
})

const onlineDev = computed(() => deviceList.value.filter(d => d.status === '在线').length)
const offlineDev = computed(() => deviceList.value.filter(d => d.status === '离线').length)
const lowBattery = computed(() => deviceList.value.filter(d => d.battery < 20).length)

const dictService = serviceTypes.map((n, i) => ({ code: 'SV' + (i + 1), name: n }))
const dictDisease = chronicDiseases.map((n, i) => ({ code: 'DI' + (i + 1), name: n }))
const dictAlert = alertTypes.map((n, i) => ({ code: 'AL' + (i + 1), name: n, level: ['跌倒','SOS一键呼叫'].includes(n) ? '高危' : n === '设备离线' ? '一般' : '紧急' }))
const dictCare = careLevels.map((n, i) => ({ code: 'CA' + (i + 1), name: n }))
const dictPriority = [{ code: 'P0', name: '紧急' }, { code: 'P1', name: '普通' }]
const dictArea = areas.map((n, i) => ({ code: 'AR' + (i + 1), name: n }))

async function toggleUser(row) {
  await systemApi.toggleUser(row.id)
  row.active = !row.active
  ElMessage.success('状态已更新')
}
</script>

<style scoped>
.stat-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
</style>
