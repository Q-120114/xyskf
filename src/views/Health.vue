<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">健康监测</h2>
      <el-radio-group v-model="viewMode" size="default">
        <el-radio-button label="list">列表视图</el-radio-button>
        <el-radio-button label="trend">趋势分析</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 统计 -->
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#67c23a"><el-icon><Monitor /></el-icon></div><div><div class="stat-value">{{ onlineCount }}</div><div class="stat-label">在线监测</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#f56c6c"><el-icon><FirstAidKit /></el-icon></div><div><div class="stat-value">{{ abnormalCount }}</div><div class="stat-label">异常人数</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e6a23c"><el-icon><Connection /></el-icon></div><div><div class="stat-value">{{ offlineCount }}</div><div class="stat-label">设备离线</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#409eff"><el-icon><DataAnalysis /></el-icon></div><div><div class="stat-value">{{ highRiskCount }}</div><div class="stat-label">高危风险</div></div></div>
    </div>

    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" class="card">
      <el-form :inline="true" :model="filters" style="margin-bottom:12px">
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="姓名/编号" clearable style="width:160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" value="正常" />
            <el-option label="异常" value="异常" />
            <el-option label="高危" value="高危" />
            <el-option label="离线" value="离线" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-table :data="filteredList" stripe border height="520">
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column label="心率(bpm)" width="110">
          <template #default="{ row }"><span :class="{ danger: row.hr > 110 || row.hr < 50 }">{{ row.hr }}</span></template>
        </el-table-column>
        <el-table-column label="血氧(%)" width="100">
          <template #default="{ row }"><span :class="{ danger: row.spo2 < 92 }">{{ row.spo2 }}</span></template>
        </el-table-column>
        <el-table-column label="血压(mmHg)" width="130">
          <template #default="{ row }"><span :class="{ danger: row.sbp >= 160 }">{{ row.sbp }}/{{ row.dbp }}</span></template>
        </el-table-column>
        <el-table-column label="血糖(mmol/L)" width="120">
          <template #default="{ row }"><span :class="{ danger: row.bg > 11 }">{{ row.bg }}</span></template>
        </el-table-column>
        <el-table-column label="体温(℃)" width="100">
          <template #default="{ row }"><span :class="{ danger: row.temp > 37.3 }">{{ row.temp }}</span></template>
        </el-table-column>
        <el-table-column label="步数" width="80" prop="steps" />
        <el-table-column label="睡眠(h)" width="80" prop="sleep" />
        <el-table-column label="在床" width="70">
          <template #default="{ row }">
            <el-tag :type="row.inBed ? 'success' : 'info'" size="small">{{ row.inBed ? '在床' : '离床' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备" width="70">
          <template #default="{ row }">
            <el-tag :type="row.deviceOnline ? 'success' : 'danger'" size="small">{{ row.deviceOnline ? '在线' : '离线' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="riskType(row.riskLevel)" size="small">{{ row.riskLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="100" prop="lastUpdate" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showTrend(row)">趋势</el-button>
            <el-button size="small" type="warning" @click="setThreshold(row)">阈值</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 趋势视图 -->
    <div v-else class="card">
      <div style="display:flex;gap:16px;margin-bottom:16px;align-items:center">
        <el-select v-model="selectedId" placeholder="选择老人" style="width:200px" @change="loadTrend">
          <el-option v-for="e in healthData" :key="e.id" :label="e.name + '(' + e.id + ')'" :value="e.id" />
        </el-select>
        <el-radio-group v-model="trendRange">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
        </el-radio-group>
        <span style="color:#909399;font-size:13px" v-if="selectedId">{{ currentElderly?.name }} · {{ currentElderly?.age }}岁</span>
      </div>

      <div class="trend-grid">
        <div class="trend-card">
          <h3 class="section-title">心率趋势 (bpm)</h3>
          <v-chart :option="hrOption" style="height:200px" autoresize />
        </div>
        <div class="trend-card">
          <h3 class="section-title">血压趋势 (mmHg)</h3>
          <v-chart :option="bpOption" style="height:200px" autoresize />
        </div>
        <div class="trend-card">
          <h3 class="section-title">血氧趋势 (%)</h3>
          <v-chart :option="spo2Option" style="height:200px" autoresize />
        </div>
        <div class="trend-card">
          <h3 class="section-title">血糖趋势 (mmol/L)</h3>
          <v-chart :option="bgOption" style="height:200px" autoresize />
        </div>
      </div>

      <!-- 健康评估小结 -->
      <div class="health-summary">
        <h3 class="section-title">健康评估小结</h3>
        <el-alert :title="summaryTitle" :type="summaryType" :closable="false" show-icon style="margin-bottom:12px" />
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="平均心率">{{ avgHr }} bpm</el-descriptions-item>
          <el-descriptions-item label="平均血压">{{ avgBp.sbp }}/{{ avgBp.dbp }} mmHg</el-descriptions-item>
          <el-descriptions-item label="平均血氧">{{ avgSpo2 }} %</el-descriptions-item>
          <el-descriptions-item label="平均血糖">{{ avgBg }} mmol/L</el-descriptions-item>
          <el-descriptions-item label="日均步数">{{ avgSteps }} 步</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="summaryType">{{ currentElderly?.riskLevel }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 阈值设置弹窗 -->
    <el-dialog v-model="thresholdVisible" title="健康阈值配置" width="500px">
      <div v-if="currentElderly" style="margin-bottom:12px;color:#909399">为 {{ currentElderly.name }} 设置个性化告警阈值</div>
      <el-form label-width="120px">
        <el-form-item label="心率上限 (bpm)"><el-input-number v-model="threshold.hrMax" :min="60" :max="200" /></el-form-item>
        <el-form-item label="心率下限 (bpm)"><el-input-number v-model="threshold.hrMin" :min="30" :max="80" /></el-form-item>
        <el-form-item label="收缩压上限"><el-input-number v-model="threshold.sbpMax" :min="100" :max="220" /></el-form-item>
        <el-form-item label="血氧下限 (%)"><el-input-number v-model="threshold.spo2Min" :min="80" :max="100" /></el-form-item>
        <el-form-item label="血糖上限"><el-input-number v-model="threshold.bgMax" :min="6" :max="20" :precision="1" :step="0.1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="thresholdVisible = false">取消</el-button>
        <el-button type="primary" @click="saveThreshold">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { healthApi } from '../api'

const viewMode = ref('list')
const filters = reactive({ keyword: '', status: '' })
const selectedId = ref('')
const trendRange = ref('week')
const thresholdVisible = ref(false)
const currentElderly = ref(null)
const threshold = reactive({ hrMax: 110, hrMin: 50, sbpMax: 160, spo2Min: 92, bgMax: 11 })
const healthData = ref([])
const trend = ref({ dates: [], hr: [], sbp: [], dbp: [], spo2: [], bg: [], steps: [] })

async function loadList() {
  const params = { ...filters }
  if (!params.keyword) delete params.keyword
  if (!params.status) delete params.status
  healthData.value = await healthApi.list(params)
}
onMounted(loadList)
watch(filters, loadList, { deep: true })

const onlineCount = computed(() => healthData.value.filter(h => h.deviceOnline).length)
const abnormalCount = computed(() => healthData.value.filter(h => h.abnormal).length)
const offlineCount = computed(() => healthData.value.filter(h => !h.deviceOnline).length)
const highRiskCount = computed(() => healthData.value.filter(h => h.riskLevel === '高危').length)

const filteredList = computed(() => healthData.value)

function riskType(level) {
  return { '正常': 'success', '异常': 'warning', '高危': 'danger' }[level]
}

async function showTrend(row) {
  viewMode.value = 'trend'
  selectedId.value = row.id
  await loadTrend()
}

function setThreshold(row) {
  currentElderly.value = row
  thresholdVisible.value = true
}

async function saveThreshold() {
  await healthApi.setThreshold({ elderlyId: currentElderly.value?.id, ...threshold })
  thresholdVisible.value = false
  ElMessage.success('阈值配置已保存')
}

async function loadTrend() {
  currentElderly.value = healthData.value.find(h => h.id === selectedId.value)
  if (selectedId.value) {
    trend.value = await healthApi.trend(selectedId.value)
  }
}

const baseOption = (data, color, markArea) => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: trend.value.dates },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data, itemStyle: { color }, areaStyle: { opacity: 0.15 }, markLine: markArea ? { silent: true, data: markArea } : undefined }]
})

const hrOption = computed(() => baseOption(trend.value.hr, '#f56c6c', [{ yAxis: 110, lineStyle: { color: '#f56c6c' } }]))
const bpOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['收缩压', '舒张压'], bottom: 0, textStyle: { fontSize: 11 } },
  grid: { left: 40, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: trend.value.dates },
  yAxis: { type: 'value' },
  series: [
    { name: '收缩压', type: 'line', smooth: true, data: trend.value.sbp, itemStyle: { color: '#f56c6c' } },
    { name: '舒张压', type: 'line', smooth: true, data: trend.value.dbp, itemStyle: { color: '#409eff' } }
  ]
}))
const spo2Option = computed(() => baseOption(trend.value.spo2, '#67c23a'))
const bgOption = computed(() => baseOption(trend.value.bg, '#e6a23c'))

const avgHr = computed(() => Math.round(trend.value.hr.reduce((a, b) => a + b, 0) / (trend.value.hr.length || 1)))
const avgBp = computed(() => ({
  sbp: Math.round(trend.value.sbp.reduce((a, b) => a + b, 0) / (trend.value.sbp.length || 1)),
  dbp: Math.round(trend.value.dbp.reduce((a, b) => a + b, 0) / (trend.value.dbp.length || 1))
}))
const avgSpo2 = computed(() => Math.round(trend.value.spo2.reduce((a, b) => a + b, 0) / (trend.value.spo2.length || 1)))
const avgBg = computed(() => (trend.value.bg.reduce((a, b) => a + b, 0) / (trend.value.bg.length || 1)).toFixed(1))
const avgSteps = computed(() => Math.round(trend.value.steps.reduce((a, b) => a + b, 0) / (trend.value.steps.length || 1)))

const summaryTitle = computed(() => {
  const r = currentElderly.value?.riskLevel
  if (r === '高危') return '存在多项指标异常，建议立即关注并安排上门检查'
  if (r === '异常') return '部分指标超出正常范围，需加强日常监测'
  return '各项指标基本正常，继续保持规律监测'
})
const summaryType = computed(() => {
  const r = currentElderly.value?.riskLevel
  return { '高危': 'error', '异常': 'warning', '正常': 'success' }[r]
})
</script>

<style scoped>
.danger { color: #f56c6c; font-weight: 600; }
.trend-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}
.trend-card {
  background: #fafafa; border-radius: 6px; padding: 12px;
}
.health-summary { margin-top: 8px; }
</style>
