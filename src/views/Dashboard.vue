<template>
  <div class="dashboard">
    <!-- 顶部统计卡 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:#409eff"><el-icon><User /></el-icon></div>
        <div>
          <div class="stat-value">{{ stats.totalElderly }}</div>
          <div class="stat-label">在管老人总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f56c6c"><el-icon><Warning /></el-icon></div>
        <div>
          <div class="stat-value">{{ stats.keyElderly }}</div>
          <div class="stat-label">重点关爱老人</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#67c23a"><el-icon><Monitor /></el-icon></div>
        <div>
          <div class="stat-value">{{ stats.monitored }}</div>
          <div class="stat-label">在线监测人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#e6a23c"><el-icon><FirstAidKit /></el-icon></div>
        <div>
          <div class="stat-value">{{ stats.abnormal }}</div>
          <div class="stat-label">健康异常人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#13c2c2"><el-icon><UserFilled /></el-icon></div>
        <div>
          <div class="stat-value">{{ stats.onlineStaff }}</div>
          <div class="stat-label">在岗人员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#722ed1"><el-icon><Tickets /></el-icon></div>
        <div>
          <div class="stat-value">{{ stats.pendingOrders }}</div>
          <div class="stat-label">待处理工单</div>
        </div>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="timeRange" size="default">
        <el-radio-button label="today">今日</el-radio-button>
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>
      <div class="live-dot"><span class="dot"></span>实时更新中</div>
    </div>

    <!-- 第一行：地图 + 健康看板 -->
    <div class="row">
      <div class="col col-8">
        <div class="panel">
          <h3 class="section-title">社区地图总览</h3>
          <div class="map-box">
            <div class="map-bg">
              <!-- 简易社区地图，用楼栋网格模拟 -->
              <div
                v-for="b in buildings"
                :key="b.name"
                class="building"
                :style="{ left: b.x + '%', top: b.y + '%', background: b.color }"
                :title="b.name"
              >
                <div class="b-name">{{ b.name }}</div>
                <div class="b-count">{{ b.count }}人</div>
              </div>
              <!-- 老人点位 -->
              <div
                v-for="(p, i) in mapPoints"
                :key="'p' + i"
                class="point"
                :class="{ key: p.isKey, alert: p.alert }"
                :style="{ left: p.x + '%', top: p.y + '%' }"
                :title="p.name + (p.alert ? ' [告警]' : '')"
              ></div>
              <!-- 人员点位 -->
              <div
                v-for="(s, i) in staffPoints"
                :key="'s' + i"
                class="point staff"
                :style="{ left: s.x + '%', top: s.y + '%' }"
                :title="s.name"
              ></div>
            </div>
            <div class="map-legend">
              <span><i class="dot-normal"></i>普通老人</span>
              <span><i class="dot-key"></i>重点老人</span>
              <span><i class="dot-alert"></i>告警点位</span>
              <span><i class="dot-staff"></i>在岗人员</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col col-4">
        <div class="panel">
          <h3 class="section-title">健康指标看板</h3>
          <v-chart :option="healthPieOption" style="height: 200px" autoresize />
          <div class="mini-stats">
            <div><span class="num">{{ stats.monitored }}</span><span class="lbl">监测中</span></div>
            <div><span class="num danger">{{ stats.abnormal }}</span><span class="lbl">异常</span></div>
            <div><span class="num">{{ offlineDevices }}</span><span class="lbl">离线设备</span></div>
          </div>
        </div>
        <div class="panel mt">
          <h3 class="section-title">慢病分布</h3>
          <v-chart :option="chronicOption" style="height: 180px" autoresize />
        </div>
      </div>
    </div>

    <!-- 第二行：服务需求 + 紧急事件 -->
    <div class="row">
      <div class="col col-6">
        <div class="panel">
          <h3 class="section-title">服务需求看板</h3>
          <v-chart :option="serviceBarOption" style="height: 220px" autoresize />
          <div class="order-stats">
            <div class="o-item"><span class="tag-warning">{{ pendingOrderCount }}</span>待处理</div>
            <div class="o-item"><span class="tag-info">{{ doingOrderCount }}</span>进行中</div>
            <div class="o-item"><span class="tag-success">{{ doneOrderCount }}</span>已完成</div>
          </div>
        </div>
      </div>
      <div class="col col-6">
        <div class="panel">
          <h3 class="section-title">紧急事件看板</h3>
          <v-chart :option="alertOption" style="height: 220px" autoresize />
          <div class="alert-stats">
            <div class="a-item danger">
              <span class="big">{{ stats.pendingAlerts }}</span>
              <span>未处置告警</span>
            </div>
            <div class="a-item warning">
              <span class="big">{{ highAlertCount }}</span>
              <span>高危告警</span>
            </div>
            <div class="a-item info">
              <span class="big">{{ todayAlertCount }}</span>
              <span>今日告警</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第三行：人员响应 + 重点人群 + 趋势 -->
    <div class="row">
      <div class="col col-4">
        <div class="panel">
          <h3 class="section-title">人员 & 响应看板</h3>
          <div class="resp-gauge">
            <v-chart :option="gaugeOption" style="height: 180px" autoresize />
          </div>
          <div class="resp-list">
            <div class="resp-row" v-for="s in topStaff" :key="s.id">
              <span class="resp-name">{{ s.name }}</span>
              <span class="resp-area">{{ s.area }}</span>
              <span class="resp-time">{{ s.avgResponse }}分钟</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col col-4">
        <div class="panel">
          <h3 class="section-title">重点人群专区</h3>
          <div class="key-grid">
            <div class="key-card k1">
              <div class="kv">{{ aloneCount }}</div>
              <div class="kl">独居老人</div>
            </div>
            <div class="key-card k2">
              <div class="kv">{{ disabledCount }}</div>
              <div class="kl">失能老人</div>
            </div>
            <div class="key-card k3">
              <div class="kv">{{ oldCount }}</div>
              <div class="kl">高龄老人(≥80)</div>
            </div>
            <div class="key-card k4">
              <div class="kv">{{ halfCount }}</div>
              <div class="kl">半失能老人</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col col-4">
        <div class="panel">
          <h3 class="section-title">月度趋势</h3>
          <v-chart :option="trendOption" style="height: 260px" autoresize />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { statsApi, elderlyApi, healthApi, ordersApi, alertsApi, staffApi, systemApi } from '../api'
import { barOption, pieOption, lineOption, axisGrid, ALERT_COLORS } from '../utils/chartOptions'

const timeRange = ref('today')
const stats = ref({ totalElderly: 0, keyElderly: 0, monitored: 0, abnormal: 0, onlineStaff: 0, pendingAlerts: 0, pendingOrders: 0, avgResponse: 0 })

const elderlyList = ref([])
const healthData = ref([])
const orders = ref([])
const alerts = ref([])
const staffList = ref([])
const deviceList = ref([])
const chronicData = ref([])
const serviceData = ref([])
const alertTypeData = ref([])
const trendData = ref({ months: [], orders: [], alerts: [] })

onMounted(async () => {
  const [s, e, h, o, a, st, dv, ch, sv, at, tr] = await Promise.all([
    statsApi.dashboard(),
    elderlyApi.list(),
    healthApi.list(),
    ordersApi.list(),
    alertsApi.list(),
    staffApi.list(),
    systemApi.devices(),
    statsApi.chronic(),
    statsApi.serviceTypes(),
    statsApi.alertTypes(),
    statsApi.monthlyTrend()
  ])
  stats.value = s
  elderlyList.value = e
  healthData.value = h
  orders.value = o
  alerts.value = a
  staffList.value = st
  deviceList.value = dv
  chronicData.value = ch
  serviceData.value = sv
  alertTypeData.value = at
  trendData.value = tr
})

const offlineDevices = computed(() => deviceList.value.filter(d => d.status === '离线').length)
const pendingOrderCount = computed(() => orders.value.filter(o => o.status === '新建').length)
const doingOrderCount = computed(() => orders.value.filter(o => ['已派单', '已接单', '上门中'].includes(o.status)).length)
const doneOrderCount = computed(() => orders.value.filter(o => ['已完成', '已评价'].includes(o.status)).length)
const highAlertCount = computed(() => alerts.value.filter(a => a.level === '高危' && a.status !== '已结案').length)
const todayAlertCount = computed(() => alerts.value.filter(a => a.time.startsWith(new Date().toLocaleDateString('zh-CN').slice(5))).length)

const aloneCount = computed(() => elderlyList.value.filter(e => e.tags.includes('独居老人')).length)
const disabledCount = computed(() => elderlyList.value.filter(e => e.careLevel === '失能').length)
const halfCount = computed(() => elderlyList.value.filter(e => e.careLevel === '半失能').length)
const oldCount = computed(() => elderlyList.value.filter(e => e.age >= 80).length)

const topStaff = computed(() => [...staffList.value].sort((a, b) => a.avgResponse - b.avgResponse).slice(0, 5))

const buildings = [
  { name: '1号楼', x: 10, y: 15, count: 18, color: '#409eff' },
  { name: '2号楼', x: 30, y: 15, count: 22, color: '#409eff' },
  { name: '3号楼', x: 50, y: 15, count: 15, color: '#409eff' },
  { name: '4号楼', x: 70, y: 15, count: 20, color: '#409eff' },
  { name: '5号楼', x: 10, y: 50, count: 16, color: '#67c23a' },
  { name: '6号楼', x: 30, y: 50, count: 12, color: '#67c23a' },
  { name: '7号楼', x: 50, y: 50, count: 14, color: '#e6a23c' },
  { name: '8号楼', x: 70, y: 50, count: 11, color: '#f56c6c' }
]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const mapPoints = computed(() => {
  const sample = elderlyList.value.slice(0, 60)
  return sample.map(e => {
    const x = 8 + ((parseInt(e.building.replace(/\D/g, '')) - 1) % 4) * 20 + rand(0, 15)
    const y = parseInt(e.building.replace(/\D/g, '')) > 4 ? 52 : 17
    const alert = healthData.value.find(h => h.id === e.id)?.abnormal
    return { name: e.name, x: x + rand(-3, 3), y: y + rand(-3, 12), isKey: e.isKey, alert }
  })
})

const staffPoints = computed(() =>
  staffList.value.filter(s => s.online).map(s => ({
    name: s.name,
    x: 8 + ((s.id.charCodeAt(3) - 48) % 4) * 20 + rand(0, 15),
    y: s.id.charCodeAt(3) % 2 ? 52 : 17
  }))
)

const healthPieOption = computed(() => pieOption({
  data: [
    { value: stats.value.monitored - stats.value.abnormal, name: '正常' },
    { value: stats.value.abnormal, name: '异常' },
    { value: elderlyList.value.length - stats.value.monitored, name: '未监测' }
  ],
  colors: ['#67c23a', '#f56c6c', '#c0c4cc']
}))

const chronicOption = computed(() => barOption({
  xData: chronicData.value.map(d => d.name),
  series: chronicData.value.map(d => d.value),
  color: '#13c2c2',
  horizontal: true
}))

const serviceBarOption = computed(() => barOption({
  xData: serviceData.value.map(d => d.name),
  series: serviceData.value.map(d => d.value),
  color: '#409eff'
}))

const alertOption = computed(() => ({
  tooltip: {},
  grid: axisGrid({ bottom: 60 }),
  xAxis: { type: 'category', data: alertTypeData.value.map(d => d.name), axisLabel: { fontSize: 10, rotate: 30 } },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar', data: alertTypeData.value.map(d => d.value),
    itemStyle: { color: (p) => ALERT_COLORS[p.dataIndex], borderRadius: [4, 4, 0, 0] },
    barWidth: '50%'
  }]
}))

const gaugeOption = computed(() => ({
  series: [{
    type: 'gauge', radius: '90%', progress: { show: true, width: 12 },
    axisLine: { lineStyle: { width: 12 } }, axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { width: 1 } },
    axisLabel: { fontSize: 10, distance: 16 }, pointer: { width: 4 },
    detail: { valueAnimation: true, formatter: '{value} 分', fontSize: 18, offsetCenter: [0, '30%'] },
    data: [{ value: Math.max(60, 100 - stats.value.avgResponse * 2), name: '响应评分' }],
    min: 0, max: 100
  }]
}))

const trendOption = computed(() => lineOption({
  xData: trendData.value.months,
  series: [
    { name: '服务工单', data: trendData.value.orders },
    { name: '告警事件', data: trendData.value.alerts }
  ],
  area: true
}))
</script>

<style scoped>
.dashboard {
  padding: 16px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
@media (max-width: 1400px) {
  .stat-grid { grid-template-columns: repeat(3, 1fr); }
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 12px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
}
.stat-value { font-size: 26px; font-weight: 700; color: #303133; line-height: 1.1; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.live-dot { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #67c23a; }
.live-dot .dot {
  width: 8px; height: 8px; border-radius: 50%; background: #67c23a;
  animation: blink 1.5s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

.row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.col-8 { grid-column: span 8; }
.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
@media (max-width: 1200px) {
  .col-8, .col-6, .col-4 { grid-column: span 12; }
}
.panel {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.panel.mt { margin-top: 12px; }

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-title::before {
  content: '';
  width: 3px; height: 14px;
  background: #409eff;
  border-radius: 2px;
}

.map-box { position: relative; }
.map-bg {
  position: relative;
  height: 380px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d6e4ff;
}
.building {
  position: absolute;
  width: 80px; height: 50px;
  border-radius: 6px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  opacity: 0.85;
}
.b-name { font-weight: 600; }
.b-count { font-size: 10px; opacity: 0.9; }
.point {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #409eff;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px rgba(64,158,255,0.6);
}
.point.key { background: #e6a23c; box-shadow: 0 0 6px rgba(230,162,60,0.8); }
.point.alert { background: #f56c6c; box-shadow: 0 0 8px rgba(245,108,108,0.9); animation: blink 1s infinite; }
.point.staff { background: #67c23a; width: 10px; height: 10px; box-shadow: 0 0 8px rgba(103,194,58,0.8); }
.map-legend {
  display: flex; gap: 16px; margin-top: 10px; font-size: 12px; color: #606266;
  flex-wrap: wrap;
}
.map-legend i {
  display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle;
}
.dot-normal { background: #409eff; }
.dot-key { background: #e6a23c; }
.dot-alert { background: #f56c6c; }
.dot-staff { background: #67c23a; }

.mini-stats {
  display: flex; justify-content: space-around;
  padding: 12px 0; border-top: 1px solid #f0f0f0;
}
.mini-stats > div { text-align: center; }
.mini-stats .num { display: block; font-size: 20px; font-weight: 700; }
.mini-stats .num.danger { color: #f56c6c; }
.mini-stats .lbl { font-size: 12px; color: #909399; }

.order-stats {
  display: flex; justify-content: space-around;
  padding-top: 10px; border-top: 1px solid #f0f0f0;
}
.o-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px; color: #606266; }

.alert-stats { display: flex; justify-content: space-around; padding-top: 10px; border-top: 1px solid #f0f0f0; }
.a-item { text-align: center; }
.a-item .big { display: block; font-size: 22px; font-weight: 700; }
.a-item.danger .big { color: #f56c6c; }
.a-item.warning .big { color: #e6a23c; }
.a-item.info .big { color: #909399; }
.a-item span:last-child { font-size: 12px; color: #909399; }

.resp-list { margin-top: 8px; }
.resp-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #f5f5f5;
}
.resp-name { font-weight: 500; }
.resp-area { color: #909399; font-size: 12px; }
.resp-time { color: #67c23a; font-weight: 600; }

.key-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.key-card {
  border-radius: 8px; padding: 16px; color: #fff; text-align: center;
}
.k1 { background: linear-gradient(135deg, #667eea, #764ba2); }
.k2 { background: linear-gradient(135deg, #f093fb, #f5576c); }
.k3 { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.k4 { background: linear-gradient(135deg, #fa709a, #fee140); }
.kv { font-size: 28px; font-weight: 700; }
.kl { font-size: 12px; opacity: 0.9; margin-top: 2px; }
</style>
