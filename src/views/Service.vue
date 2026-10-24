<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">服务需求工单</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新建工单
        </el-button>
      </div>
    </div>

    <!-- 工单状态统计 -->
    <div class="order-tabs">
      <div v-for="t in tabs" :key="t.key" class="order-tab" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
        <span class="ot-label">{{ t.label }}</span>
        <span class="ot-count" :style="{ color: t.color }">{{ countByStatus(t.key) }}</span>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="card filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="工单编号/老人" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width:130px">
            <el-option v-for="t in serviceTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="全部" clearable style="width:100px">
            <el-option label="普通" value="普通" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" placeholder="全部" clearable style="width:130px">
            <el-option v-for="s in sources" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工单列表 -->
    <div class="card" style="margin-top:12px">
      <el-table :data="filteredOrders" stripe border height="500">
        <el-table-column prop="id" label="工单编号" width="130" />
        <el-table-column prop="elderlyName" label="服务对象" width="90" />
        <el-table-column prop="area" label="片区" width="110" />
        <el-table-column label="服务类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.serviceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="row.priority === '紧急' ? 'danger' : 'info'" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="80" />
        <el-table-column prop="createdAt" label="创建时间" width="150" />
        <el-table-column label="服务时长" width="90">
          <template #default="{ row }">
            <span v-if="row.duration">{{ row.duration }}分钟</span>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="评价" width="80">
          <template #default="{ row }">
            <el-rate v-if="row.rating" :model-value="row.rating" disabled size="small" />
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">详情</el-button>
            <el-button v-if="row.status === '新建'" size="small" type="primary" @click="dispatch(row)">派单</el-button>
            <el-button v-if="['已派单','已接单'].includes(row.status)" size="small" type="success" @click="complete(row)">完成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 工单详情/流程 -->
    <el-drawer v-model="detailVisible" title="工单详情" size="520px">
      <div v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="工单编号">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="服务对象">{{ current.elderlyName }} ({{ current.elderlyId }})</el-descriptions-item>
          <el-descriptions-item label="服务类型">{{ current.serviceType }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ current.priority }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ current.source }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ current.assignee || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ current.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ current.completedAt || '未完成' }}</el-descriptions-item>
          <el-descriptions-item label="服务时长">{{ current.duration ? current.duration + '分钟' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务照片">{{ current.photos }} 张</el-descriptions-item>
        </el-descriptions>

        <el-divider>工单流转</el-divider>
        <el-steps :active="stepIndex" finish-status="success" align-center>
          <el-step title="新建" :description="current.createdAt" />
          <el-step title="派单" :description="current.assignee ? '已分配' : '待派单'" />
          <el-step title="接单" :description="current.assignee ? '已接单' : ''" />
          <el-step title="上门服务" :description="['上门中','已完成','已评价'].includes(current.status) ? '已上门' : ''" />
          <el-step title="完成" :description="current.completedAt || ''" />
          <el-step title="评价" :description="current.rating ? current.rating + '星' : ''" />
        </el-steps>

        <el-divider v-if="current.status === '已完成' || current.status === '已评价'">服务记录</el-divider>
        <div v-if="current.status === '已完成' || current.status === '已评价'" class="service-record">
          <el-input type="textarea" :rows="3" placeholder="服务内容记录..." readonly>为老人提供{{ current.serviceType }}服务，服务过程顺利，老人状态良好。</el-input>
          <div class="photo-grid" v-if="current.photos">
            <div v-for="i in current.photos" :key="i" class="photo-placeholder">服务照片{{ i }}</div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 新建工单 -->
    <el-dialog v-model="createVisible" title="新建服务工单" width="560px">
      <el-form :model="newForm" label-width="100px">
        <el-form-item label="服务对象">
          <el-select v-model="newForm.elderlyId" filterable style="width:100%">
            <el-option v-for="e in elderlyList" :key="e.id" :label="e.name + '(' + e.id + ')'" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="newForm.serviceType" style="width:100%">
            <el-option v-for="t in serviceTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="newForm.priority">
            <el-radio label="普通" />
            <el-radio label="紧急" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="newForm.source" style="width:100%">
            <el-option v-for="s in sources" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求描述">
          <el-input type="textarea" :rows="3" v-model="newForm.desc" placeholder="请描述服务需求..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOrder">提交</el-button>
      </template>
    </el-dialog>

    <!-- 派单弹窗 -->
    <el-dialog v-model="dispatchVisible" title="派单" width="400px">
      <el-form label-width="80px">
        <el-form-item label="工单">{{ current?.id }}</el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="dispatchTo" style="width:100%">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name + '(' + s.role + ')' " :value="s.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDispatch">确认派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ordersApi, elderlyApi, staffApi } from '../api'
import { serviceTypes } from '../constants'

const activeTab = ref('all')
const filters = reactive({ keyword: '', type: '', priority: '', source: '' })
const detailVisible = ref(false)
const createVisible = ref(false)
const dispatchVisible = ref(false)
const current = ref(null)
const dispatchTo = ref('')
const newForm = reactive({ elderlyId: '', serviceType: '', priority: '普通', source: '老人线上', desc: '' })
const orders = ref([])
const elderlyList = ref([])
const staffList = ref([])

const sources = ['老人线上', '家属上报', '网格员录入', '电话登记', '巡检生成']
const tabs = [
  { key: 'all', label: '全部', color: '#409eff' },
  { key: '新建', label: '待派单', color: '#e6a23c' },
  { key: '已派单', label: '进行中', color: '#13c2c2' },
  { key: '已接单', label: '已接单', color: '#13c2c2' },
  { key: '上门中', label: '上门中', color: '#13c2c2' },
  { key: '已完成', label: '已完成', color: '#67c23a' },
  { key: '已评价', label: '已评价', color: '#67c23a' }
]

async function loadOrders() {
  const params = { ...filters, status: activeTab.value !== 'all' ? activeTab.value : undefined }
  Object.keys(params).forEach(k => !params[k] && delete params[k])
  orders.value = await ordersApi.list(params)
}

onMounted(async () => {
  const [e, s] = await Promise.all([elderlyApi.list(), staffApi.list()])
  elderlyList.value = e
  staffList.value = s
  loadOrders()
})
watch([activeTab, filters], loadOrders, { deep: true })

function countByStatus(key) {
  if (key === 'all') return orders.value.length
  return orders.value.filter(o => o.status === key).length
}

const filteredOrders = computed(() => orders.value)

function statusType(s) {
  return {
    '新建': 'info', '已派单': 'warning', '已接单': 'primary',
    '上门中': '', '已完成': 'success', '已评价': 'success'
  }[s]
}

const stepIndex = computed(() => {
  const map = { '新建': 0, '已派单': 1, '已接单': 2, '上门中': 3, '已完成': 4, '已评价': 5 }
  return map[current.value?.status] || 0
})

function viewOrder(row) {
  current.value = row
  detailVisible.value = true
}

function openCreate() {
  createVisible.value = true
}

async function submitOrder() {
  if (!newForm.elderlyId) { ElMessage.warning('请选择服务对象'); return }
  const elder = elderlyList.value.find(e => e.id === newForm.elderlyId)
  await ordersApi.create({ ...newForm, elderlyName: elder?.name, area: elder?.area })
  createVisible.value = false
  ElMessage.success('工单已创建')
  Object.assign(newForm, { elderlyId: '', serviceType: '', priority: '普通', source: '老人线上', desc: '' })
  loadOrders()
}

function dispatch(row) {
  current.value = row
  dispatchVisible.value = true
}

async function confirmDispatch() {
  if (!dispatchTo.value) { ElMessage.warning('请选择负责人'); return }
  await ordersApi.dispatch(current.value.id, dispatchTo.value)
  dispatchVisible.value = false
  ElMessage.success(`已派单给 ${dispatchTo.value}`)
  loadOrders()
}

async function complete(row) {
  await ordersApi.complete(row.id)
  ElMessage.success(`工单 ${row.id} 已完成`)
  loadOrders()
}
</script>

<style scoped>
.order-tabs {
  display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;
}
.order-tab {
  background: #fff; border-radius: 8px; padding: 12px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 2px solid transparent;
}
.order-tab.active { border-color: #409eff; background: #ecf5ff; }
.ot-label { font-size: 13px; color: #606266; }
.ot-count { font-size: 22px; font-weight: 700; }
.filter-card { margin-bottom: 0; }
.photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
.photo-placeholder {
  height: 80px; background: #f0f2f5; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #909399;
}
</style>
