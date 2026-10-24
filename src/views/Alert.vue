<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">紧急告警处置</h2>
      <div class="header-actions">
        <el-tag type="danger" effect="dark" size="large" v-if="pendingCount > 0">
          <el-icon><Bell /></el-icon> {{ pendingCount }} 条待处置
        </el-tag>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#f56c6c"><el-icon><Bell /></el-icon></div><div><div class="stat-value">{{ pendingCount }}</div><div class="stat-label">待处置告警</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e6a23c"><el-icon><Warning /></el-icon></div><div><div class="stat-value">{{ highCount }}</div><div class="stat-label">高危告警</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#409eff"><el-icon><Clock /></el-icon></div><div><div class="stat-value">{{ avgResponse }}</div><div class="stat-label">平均响应(分)</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#67c23a"><el-icon><CircleCheck /></el-icon></div><div><div class="stat-value">{{ doneCount }}</div><div class="stat-label">已结案</div></div></div>
    </div>

    <div class="row">
      <div class="col col-8">
        <!-- 告警列表 -->
        <div class="card">
          <div class="card-header">
            <h3 class="section-title">告警台账</h3>
            <el-select v-model="filterLevel" placeholder="等级" clearable style="width:100px">
              <el-option label="一般" value="一般" />
              <el-option label="紧急" value="紧急" />
              <el-option label="高危" value="高危" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="状态" clearable style="width:100px">
              <el-option label="待处置" value="待处置" />
              <el-option label="处置中" value="处置中" />
              <el-option label="已结案" value="已结案" />
            </el-select>
          </div>
          <el-table :data="filteredAlerts" stripe border height="520" @row-click="viewAlert" highlight-current-row>
            <el-table-column label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="levelType(row.level)" size="small" effect="dark">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="告警类型" width="110" />
            <el-table-column prop="elderlyName" label="老人" width="80" />
            <el-table-column prop="area" label="片区" width="110" />
            <el-table-column prop="source" label="来源" width="80" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '待处置' ? 'danger' : row.status === '处置中' ? 'warning' : 'success'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="发生时间" width="150" />
            <el-table-column prop="assignee" label="处置人" width="80" />
            <el-table-column label="响应时长" width="90">
              <template #default="{ row }">
                <span v-if="row.responseMin" :class="{ slow: row.responseMin > 15 }">{{ row.responseMin }}分钟</span>
                <span v-else style="color:#c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click.stop="viewAlert(row)">处置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="col col-4">
        <!-- 告警类型分布 -->
        <div class="card">
          <h3 class="section-title">告警类型分布</h3>
          <v-chart :option="alertPieOption" style="height:240px" autoresize />
        </div>
        <!-- 实时告警滚动 -->
        <div class="card" style="margin-top:12px">
          <h3 class="section-title">实时告警流</h3>
          <div class="alert-stream">
            <div v-for="a in recentAlerts" :key="a.id" class="stream-item" :class="'lv-' + a.level.toLowerCase()">
              <div class="stream-head">
                <el-tag :type="levelType(a.level)" size="small" effect="dark">{{ a.level }}</el-tag>
                <span class="stream-type">{{ a.type }}</span>
              </div>
              <div class="stream-body">{{ a.elderlyName }} · {{ a.area }}</div>
              <div class="stream-time">{{ a.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警处置弹窗 -->
    <el-dialog v-model="handleVisible" title="告警处置" width="600px">
      <div v-if="current">
        <el-alert :title="`${current.level}告警 · ${current.type}`" :type="levelType(current.level)" :closable="false" show-icon style="margin-bottom:16px" />
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="告警编号">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ current.time }}</el-descriptions-item>
          <el-descriptions-item label="老人">{{ current.elderlyName }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ getPhone(current.elderlyId) }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ current.address }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ current.source }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">{{ current.status }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>处置流程</el-divider>
        <el-steps :active="handleStep" finish-status="success" align-center>
          <el-step title="告警产生" :description="current.time" />
          <el-step title="认领告警" :description="current.assignee || '待认领'" />
          <el-step title="联系老人" :description="handleStep > 1 ? '已联系' : ''" />
          <el-step title="上门处置" :description="handleStep > 2 ? '已上门' : ''" />
          <el-step title="结案归档" :description="current.result || ''" />
        </el-steps>

        <el-divider>处置记录</el-divider>
        <el-form label-width="90px">
          <el-form-item label="处置人">
            <el-select v-model="handleForm.assignee" style="width:100%">
              <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="处置结果">
            <el-select v-model="handleForm.result" style="width:100%">
              <el-option label="已恢复正常" value="已恢复正常" />
              <el-option label="送医观察" value="送医观察" />
              <el-option label="家属已接回" value="家属已接回" />
              <el-option label="现场处理完毕" value="现场处理完毕" />
            </el-select>
          </el-form-item>
          <el-form-item label="处置备注">
            <el-input type="textarea" :rows="3" v-model="handleForm.note" placeholder="记录处置过程..." />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="handleVisible = false">关闭</el-button>
        <el-button type="warning" @click="advanceStep" v-if="handleStep < 4">推进流程</el-button>
        <el-button type="primary" @click="closeAlert" v-if="handleStep >= 4">结案归档</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { alertsApi, staffApi, elderlyApi, statsApi } from '../api'
import { pieOption } from '../utils/chartOptions'

const filterLevel = ref('')
const filterStatus = ref('')
const handleVisible = ref(false)
const current = ref(null)
const handleStep = ref(0)
const handleForm = reactive({ assignee: '', result: '', note: '' })
const alerts = ref([])
const staffList = ref([])
const elderlyList = ref([])
const alertTypeData = ref([])

async function loadAlerts() {
  const params = {}
  if (filterLevel.value) params.level = filterLevel.value
  if (filterStatus.value) params.status = filterStatus.value
  alerts.value = await alertsApi.list(params)
}

onMounted(async () => {
  const [s, e, t] = await Promise.all([staffApi.list(), elderlyApi.list(), statsApi.alertTypes()])
  staffList.value = s
  elderlyList.value = e
  alertTypeData.value = t
  loadAlerts()
})
watch([filterLevel, filterStatus], loadAlerts)

const pendingCount = computed(() => alerts.value.filter(a => a.status === '待处置').length)
const highCount = computed(() => alerts.value.filter(a => a.level === '高危').length)
const doneCount = computed(() => alerts.value.filter(a => a.status === '已结案').length)
const avgResponse = computed(() => {
  const list = alerts.value.filter(a => a.responseMin)
  return Math.round(list.reduce((s, a) => s + a.responseMin, 0) / (list.length || 1))
})

const filteredAlerts = computed(() => alerts.value)
const recentAlerts = computed(() => alerts.value.slice(0, 8))

function levelType(level) {
  return { '一般': 'info', '紧急': 'warning', '高危': 'danger' }[level]
}

function getPhone(id) {
  return elderlyList.value.find(e => e.id === id)?.phone || '-'
}

function viewAlert(row) {
  current.value = row
  handleForm.assignee = row.assignee || ''
  handleForm.result = ''
  handleForm.note = ''
  handleStep.value = row.status === '待处置' ? 0 : row.status === '处置中' ? 2 : 4
  handleVisible.value = true
}

function advanceStep() {
  if (handleStep.value < 4) {
    handleStep.value++
    ElMessage.success('流程已推进')
  }
}

async function closeAlert() {
  if (!handleForm.result) { ElMessage.warning('请选择处置结果'); return }
  await alertsApi.handle(current.value.id, { status: '已结案', assignee: handleForm.assignee, result: handleForm.result, responseMin: Math.floor(Math.random() * 30) + 2 })
  handleVisible.value = false
  ElMessage.success('告警已结案归档')
  loadAlerts()
}

const alertPieOption = computed(() => pieOption({
  data: alertTypeData.value,
  radius: ['40%', '65%']
}))
</script>

<style scoped>
.row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; }
.col-8 { grid-column: span 8; }
.col-4 { grid-column: span 4; }
@media (max-width: 1200px) { .col-8, .col-4 { grid-column: span 12; } }

.card-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
}
.card-header .section-title { margin: 0; margin-right: auto; }
.slow { color: #f56c6c; font-weight: 600; }

.alert-stream {
  max-height: 260px; overflow-y: auto;
}
.stream-item {
  padding: 10px; border-radius: 6px; margin-bottom: 8px;
  border-left: 3px solid #dcdfe6; background: #fafafa;
}
.stream-item.lv-高危 { border-left-color: #f56c6c; background: #fef0f0; }
.stream-item.lv-紧急 { border-left-color: #e6a23c; background: #fdf6ec; }
.stream-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.stream-type { font-weight: 600; font-size: 13px; }
.stream-body { font-size: 13px; color: #606266; }
.stream-time { font-size: 11px; color: #c0c4cc; margin-top: 2px; }
</style>
