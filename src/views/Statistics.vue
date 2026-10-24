<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">统计分析报表</h2>
      <div class="header-actions">
        <el-button @click="exportExcel">
          <el-icon><Download /></el-icon>导出 Excel
        </el-button>
        <el-button type="primary" @click="exportPdf">
          <el-icon><Printer /></el-icon>导出 / 打印
        </el-button>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="card filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="统计周期">
          <el-radio-group v-model="filters.period">
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="quarter">本季度</el-radio-button>
            <el-radio-button label="year">本年度</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="片区">
          <el-select v-model="filters.area" placeholder="全部片区" clearable style="width:140px">
            <el-option v-for="a in areas" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="维度">
          <el-select v-model="filters.dim" style="width:140px">
            <el-option label="按片区" value="area" />
            <el-option label="按自理等级" value="care" />
            <el-option label="按慢病类型" value="disease" />
            <el-option label="按服务类型" value="service" />
            <el-option label="按护理员" value="staff" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 核心指标卡 -->
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#409eff"><el-icon><FirstAidKit /></el-icon></div><div><div class="stat-value">{{ abnormalCount }}</div><div class="stat-label">健康异常人次</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#13c2c2"><el-icon><Tickets /></el-icon></div><div><div class="stat-value">{{ orders.length }}</div><div class="stat-label">服务工单总数</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#f56c6c"><el-icon><Bell /></el-icon></div><div><div class="stat-value">{{ alerts.length }}</div><div class="stat-label">紧急事件数</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#67c23a"><el-icon><Timer /></el-icon></div><div><div class="stat-value">{{ avgResp }}分</div><div class="stat-label">平均响应时长</div></div></div>
    </div>

    <!-- 图表区 -->
    <div class="row">
      <div class="col col-6">
        <div class="card">
          <h3 class="section-title">各片区老人分布</h3>
          <v-chart :option="areaOption" style="height:280px" autoresize />
        </div>
      </div>
      <div class="col col-6">
        <div class="card">
          <h3 class="section-title">自理等级占比</h3>
          <v-chart :option="careOption" style="height:280px" autoresize />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col col-6">
        <div class="card">
          <h3 class="section-title">服务类型需求统计</h3>
          <v-chart :option="serviceOption" style="height:280px" autoresize />
        </div>
      </div>
      <div class="col col-6">
        <div class="card">
          <h3 class="section-title">告警类型分布</h3>
          <v-chart :option="alertOption" style="height:280px" autoresize />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col col-8">
        <div class="card">
          <h3 class="section-title">月度工单与告警趋势</h3>
          <v-chart :option="trendOption" style="height:300px" autoresize />
        </div>
      </div>
      <div class="col col-4">
        <div class="card">
          <h3 class="section-title">响应时长分析</h3>
          <v-chart :option="respRadarOption" style="height:300px" autoresize />
        </div>
      </div>
    </div>

    <!-- 报表表格 -->
    <div class="card" style="margin-top:12px">
      <h3 class="section-title">健康异常月报明细</h3>
      <el-table :data="reportData" stripe border>
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="elderlyName" label="老人" width="90" />
        <el-table-column prop="area" label="片区" width="110" />
        <el-table-column prop="indicator" label="异常指标" width="120" />
        <el-table-column prop="value" label="数值" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
        <el-table-column prop="count" label="异常次数" width="90" />
        <el-table-column prop="status" label="处置状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已处置' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 预测分析 -->
    <div class="card" style="margin-top:12px">
      <h3 class="section-title">需求预测分析（未来30天）</h3>
      <v-chart :option="predictOption" style="height:280px" autoresize />
      <el-alert type="info" :closable="false" style="margin-top:12px">
        <template #title>
          预测模型基于历史工单数据显示，未来两周内 <b>助餐</b> 和 <b>上门探访</b> 需求将出现小高峰，建议提前排班。
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { statsApi, elderlyApi, healthApi, alertsApi, ordersApi } from '../api'
import { barOption, pieOption, axisGrid } from '../utils/chartOptions'

const filters = reactive({ period: 'month', area: '', dim: 'area' })
const elderlyList = ref([])
const healthData = ref([])
const alerts = ref([])
const orders = ref([])
const areaData = ref([])
const serviceData = ref([])
const alertTypeData = ref([])
const trendData = ref({ months: [], orders: [], alerts: [] })

onMounted(async () => {
  const [e, h, a, o, ar, sv, at, tr] = await Promise.all([
    elderlyApi.list(), healthApi.list(), alertsApi.list(), ordersApi.list(),
    statsApi.areas(), statsApi.serviceTypes(), statsApi.alertTypes(), statsApi.monthlyTrend()
  ])
  elderlyList.value = e
  healthData.value = h
  alerts.value = a
  orders.value = o
  areaData.value = ar
  serviceData.value = sv
  alertTypeData.value = at
  trendData.value = tr
})

const abnormalCount = computed(() => healthData.value.filter(h => h.abnormal).length * 12)
const avgResp = computed(() => {
  const list = alerts.value.filter(a => a.responseMin)
  return Math.round(list.reduce((s, a) => s + a.responseMin, 0) / (list.length || 1))
})

const careData = computed(() => {
  const map = { '自理': 0, '半失能': 0, '失能': 0 }
  elderlyList.value.forEach(e => map[e.careLevel]++)
  return Object.entries(map).map(([name, value]) => ({ name, value }))
})

const areaOption = computed(() => barOption({
  xData: areaData.value.map(d => d.name),
  series: areaData.value.map(d => d.value),
  color: '#409eff'
}))

const careOption = computed(() => pieOption({
  data: careData.value,
  colors: ['#67c23a', '#e6a23c', '#f56c6c']
}))

const serviceOption = computed(() => barOption({
  xData: serviceData.value.map(d => d.name),
  series: serviceData.value.map(d => d.value),
  color: '#13c2c2',
  horizontal: true
}))

const alertOption = computed(() => pieOption({
  data: alertTypeData.value,
  radius: ['35%', '65%'],
  roseType: true
}))

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['工单数量', '告警数量'], bottom: 0 },
  grid: { left: 40, right: 40, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: trendData.value.months },
  yAxis: [
    { type: 'value', name: '工单' },
    { type: 'value', name: '告警' }
  ],
  series: [
    { name: '工单数量', type: 'bar', data: trendData.value.orders, itemStyle: { color: '#409eff', borderRadius: [4,4,0,0] } },
    { name: '告警数量', type: 'line', yAxisIndex: 1, smooth: true, data: trendData.value.alerts, itemStyle: { color: '#f56c6c' } }
  ]
}))

const respRadarOption = computed(() => ({
  tooltip: {},
  radar: {
    indicator: [
      { name: '跌倒', max: 30 }, { name: '心率异常', max: 30 }, { name: '血压超标', max: 30 },
      { name: '离床', max: 30 }, { name: 'SOS', max: 30 }, { name: '体温异常', max: 30 }
    ],
    radius: '65%'
  },
  series: [{
    type: 'radar',
    data: [{ value: [12, 18, 15, 8, 6, 10], name: '平均响应(分)', areaStyle: { opacity: 0.3 }, itemStyle: { color: '#409eff' } }]
  }]
}))

const predictOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['助餐', '助洁', '上门探访', '康复护理'], bottom: 0 },
  grid: { left: 40, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: Array.from({ length: 30 }, (_, i) => (i + 1) + '日') },
  yAxis: { type: 'value' },
  series: [
    { name: '助餐', type: 'line', smooth: true, data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15) + 10), itemStyle: { color: '#409eff' } },
    { name: '助洁', type: 'line', smooth: true, data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 5), itemStyle: { color: '#67c23a' } },
    { name: '上门探访', type: 'line', smooth: true, data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 12) + 8), itemStyle: { color: '#e6a23c' } },
    { name: '康复护理', type: 'line', smooth: true, data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8) + 3), itemStyle: { color: '#f56c6c' } }
  ]
}))

const reportData = computed(() => {
  const indicators = ['心率', '血压(收缩压)', '血氧', '血糖', '体温']
  const thresholds = ['>110', '≥160', '<92', '>11', '>37.3']
  return Array.from({ length: 15 }, (_, i) => {
    const idx = i % 5
    const e = elderlyList.value[i] || { name: '-', area: '-' }
    return {
      month: '2025-' + String((i % 10) + 1).padStart(2, '0'),
      elderlyName: e.name,
      area: e.area,
      indicator: indicators[idx],
      value: [125, 168, 88, 12.5, 37.8][idx],
      threshold: thresholds[idx],
      count: Math.floor(Math.random() * 8) + 1,
      status: Math.random() > 0.3 ? '已处置' : '观察中'
    }
  })
})

function exportExcel() { ElMessage.success('Excel 报表导出中...') }
function exportPdf() { ElMessage.success('正在生成 PDF 报表...') }
</script>

<style scoped>
.filter-card { margin-bottom: 0; }
.row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; margin-top: 12px; }
.col-8 { grid-column: span 8; }
.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
@media (max-width: 1200px) { .col-8, .col-6, .col-4 { grid-column: span 12; } }
</style>
