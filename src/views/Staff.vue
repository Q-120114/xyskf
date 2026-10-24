<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">人员管理与响应监控</h2>
      <div class="header-actions">
        <el-button type="primary">
          <el-icon><Plus /></el-icon>新增人员
        </el-button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#409eff"><el-icon><User /></el-icon></div><div><div class="stat-value">{{ staffList.length }}</div><div class="stat-label">人员总数</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#67c23a"><el-icon><Connection /></el-icon></div><div><div class="stat-value">{{ onlineCount }}</div><div class="stat-label">在岗在线</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e6a23c"><el-icon><Loading /></el-icon></div><div><div class="stat-value">{{ servingCount }}</div><div class="stat-label">服务中</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#f56c6c"><el-icon><AlarmClock /></el-icon></div><div><div class="stat-value">{{ overtimeCount }}</div><div class="stat-label">响应超时</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#13c2c2"><el-icon><Timer /></el-icon></div><div><div class="stat-value">{{ avgResponse }}分</div><div class="stat-label">平均响应时长</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#722ed1"><el-icon><Star /></el-icon></div><div><div class="stat-value">{{ avgRating }}</div><div class="stat-label">平均评分</div></div></div>
    </div>

    <div class="row">
      <div class="col col-8">
        <!-- 人员地图 -->
        <div class="card">
          <h3 class="section-title">人员实时分布地图</h3>
          <div class="map-box">
            <div class="map-bg">
              <div v-for="b in buildings" :key="b.name" class="building" :style="{ left: b.x + '%', top: b.y + '%' }">
                <div class="b-name">{{ b.name }}</div>
              </div>
              <div v-for="s in staffList" :key="s.id" class="staff-marker" :class="{ offline: !s.online }"
                :style="{ left: s.lngX + '%', top: s.latY + '%' }" @click="showStaff(s)">
                <div class="marker-avatar">{{ s.avatar }}</div>
                <div class="marker-name">{{ s.name }}</div>
              </div>
            </div>
            <div class="map-legend">
              <span><i class="lg-online"></i>在岗在线</span>
              <span><i class="lg-offline"></i>离线/休息</span>
            </div>
          </div>
        </div>

        <!-- 响应时间统计 -->
        <div class="card" style="margin-top:12px">
          <h3 class="section-title">响应时间统计（近7天）</h3>
          <v-chart :option="responseOption" style="height:260px" autoresize />
        </div>
      </div>

      <div class="col col-4">
        <!-- 人员负载 -->
        <div class="card">
          <h3 class="section-title">人员负载监控</h3>
          <div class="load-list">
            <div v-for="s in staffList" :key="s.id" class="load-item">
              <div class="load-head">
                <el-avatar :size="32">{{ s.avatar }}</el-avatar>
                <div class="load-info">
                  <div class="load-name">{{ s.name }} <span class="load-role">{{ s.role }}</span></div>
                  <div class="load-area">{{ s.area }}</div>
                </div>
                <el-tag :type="s.online ? 'success' : 'info'" size="small">{{ s.status }}</el-tag>
              </div>
              <div class="load-bar">
                <div class="load-bar-inner" :style="{ width: Math.min(100, s.pendingOrders * 20) + '%', background: loadColor(s.pendingOrders) }"></div>
              </div>
              <div class="load-meta">
                <span>待办 {{ s.pendingOrders }}</span>
                <span>今日完成 {{ s.completedToday }}</span>
                <span :class="{ slow: s.avgResponse > 15 }">响应 {{ s.avgResponse }}分</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 绩效考核 -->
        <div class="card" style="margin-top:12px">
          <h3 class="section-title">绩效考核排行</h3>
          <el-table :data="rankList" size="small" stripe>
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column label="接单率" width="90">
              <template #default="{ row }">{{ row.acceptRate }}%</template>
            </el-table-column>
            <el-table-column label="完成率" width="90">
              <template #default="{ row }">{{ row.completeRate }}%</template>
            </el-table-column>
            <el-table-column label="评分" width="80">
              <template #default="{ row }"><el-rate :model-value="Number(row.rating)" disabled size="small" /></template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 人员详情/派单测算 -->
    <el-drawer v-model="staffDetail" title="人员详情" size="420px">
      <div v-if="currentStaff">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="姓名">{{ currentStaff.name }}</el-descriptions-item>
          <el-descriptions-item label="工号">{{ currentStaff.id }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ currentStaff.role }}</el-descriptions-item>
          <el-descriptions-item label="负责片区">{{ currentStaff.area }}</el-descriptions-item>
          <el-descriptions-item label="擅长服务">{{ currentStaff.skills.join('、') }}</el-descriptions-item>
          <el-descriptions-item label="在岗状态">{{ currentStaff.status }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentStaff.phone }}</el-descriptions-item>
          <el-descriptions-item label="今日完成">{{ currentStaff.completedToday }} 单</el-descriptions-item>
          <el-descriptions-item label="待办工单">{{ currentStaff.pendingOrders }} 单</el-descriptions-item>
          <el-descriptions-item label="平均响应">{{ currentStaff.avgResponse }} 分钟</el-descriptions-item>
          <el-descriptions-item label="评分">{{ currentStaff.rating }} 星</el-descriptions-item>
        </el-descriptions>
        <el-divider>距离测算</el-divider>
        <div class="distance-box">
          <el-input v-model="targetAddress" placeholder="输入目标地址(工单/告警位置)" style="margin-bottom:12px" />
          <el-button type="primary" style="width:100%" @click="calcDistance">计算距离与到达时间</el-button>
          <div v-if="distance" class="distance-result">
            <div>直线距离：<b>{{ distance }} km</b></div>
            <div>预估到达：<b>{{ eta }} 分钟</b></div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { staffApi, statsApi } from '../api'
import { axisGrid } from '../utils/chartOptions'

const staffDetail = ref(false)
const currentStaff = ref(null)
const targetAddress = ref('')
const distance = ref('')
const eta = ref('')
const staffList = ref([])
const weeklyData = ref({ days: [], avg: [], count: [] })

const buildings = [
  { name: '1号楼', x: 10, y: 15 }, { name: '2号楼', x: 30, y: 15 },
  { name: '3号楼', x: 50, y: 15 }, { name: '4号楼', x: 70, y: 15 },
  { name: '5号楼', x: 10, y: 55 }, { name: '6号楼', x: 30, y: 55 },
  { name: '7号楼', x: 50, y: 55 }, { name: '8号楼', x: 70, y: 55 }
]

onMounted(async () => {
  const [s, w] = await Promise.all([staffApi.list(), statsApi.weeklyResponse()])
  staffList.value = s.map(x => ({
    ...x,
    lngX: ((x.lng - 116.3) / 0.08) * 80 + 10,
    latY: ((x.lat - 39.9) / 0.08) * 70 + 15
  }))
  weeklyData.value = w
})

const onlineCount = computed(() => staffList.value.filter(s => s.online).length)
const servingCount = computed(() => staffList.value.filter(s => s.status === '服务中').length)
const overtimeCount = computed(() => staffList.value.filter(s => s.avgResponse > 15).length)
const avgResponse = computed(() => Math.round(staffList.value.reduce((s, x) => s + x.avgResponse, 0) / (staffList.value.length || 1)))
const avgRating = computed(() => (staffList.value.reduce((s, x) => s + Number(x.rating), 0) / (staffList.value.length || 1)).toFixed(1))

const rankList = computed(() => {
  return staffList.value.map(s => ({
    ...s,
    acceptRate: Math.min(99, 85 + Math.floor(Math.random() * 15)),
    completeRate: Math.min(99, 80 + Math.floor(Math.random() * 20))
  })).sort((a, b) => Number(b.rating) - Number(a.rating))
})

function loadColor(n) {
  if (n >= 4) return '#f56c6c'
  if (n >= 2) return '#e6a23c'
  return '#67c23a'
}

function showStaff(s) {
  currentStaff.value = s
  distance.value = ''
  staffDetail.value = true
}

function calcDistance() {
  if (!targetAddress.value) { ElMessage.warning('请输入目标地址'); return }
  distance.value = (Math.random() * 3 + 0.3).toFixed(2)
  eta.value = Math.round(Number(distance.value) * 10)
}

const responseOption = computed(() => {
  const w = weeklyData.value
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均响应时长(分)', '告警数量'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: axisGrid({ right: 40 }),
    xAxis: { type: 'category', data: w.days },
    yAxis: [
      { type: 'value', name: '分钟' },
      { type: 'value', name: '数量' }
    ],
    series: [
      { name: '平均响应时长(分)', type: 'bar', data: w.avg, itemStyle: { color: '#409eff', borderRadius: [4,4,0,0] } },
      { name: '告警数量', type: 'line', yAxisIndex: 1, smooth: true, data: w.count, itemStyle: { color: '#f56c6c' } }
    ]
  }
})
</script>

<style scoped>
.row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; }
.col-8 { grid-column: span 8; }
.col-4 { grid-column: span 4; }
@media (max-width: 1200px) { .col-8, .col-4 { grid-column: span 12; } }

.map-box { position: relative; }
.map-bg {
  position: relative; height: 340px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border-radius: 8px; overflow: hidden; border: 1px solid #d6e4ff;
}
.building {
  position: absolute; width: 60px; height: 40px;
  background: rgba(64,158,255,0.3); border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #1d6fd6;
}
.staff-marker {
  position: absolute; transform: translate(-50%, -100%);
  cursor: pointer; text-align: center;
}
.marker-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: #67c23a; color: #fff; display: flex;
  align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
  box-shadow: 0 0 8px rgba(103,194,58,0.8);
  border: 2px solid #fff;
}
.staff-marker.offline .marker-avatar { background: #c0c4cc; box-shadow: none; }
.marker-name {
  font-size: 10px; background: rgba(0,0,0,0.6); color: #fff;
  padding: 1px 4px; border-radius: 3px; margin-top: 2px; white-space: nowrap;
}
.map-legend { display: flex; gap: 16px; margin-top: 10px; font-size: 12px; color: #606266; }
.map-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
.lg-online { background: #67c23a; }
.lg-offline { background: #c0c4cc; }

.load-list { max-height: 360px; overflow-y: auto; }
.load-item { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.load-item:last-child { border-bottom: none; }
.load-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.load-info { flex: 1; }
.load-name { font-size: 13px; font-weight: 500; }
.load-role { font-size: 11px; color: #909399; font-weight: normal; }
.load-area { font-size: 11px; color: #c0c4cc; }
.load-bar { height: 6px; background: #f0f2f5; border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.load-bar-inner { height: 100%; border-radius: 3px; transition: width 0.3s; }
.load-meta { display: flex; justify-content: space-between; font-size: 11px; color: #909399; }
.load-meta .slow { color: #f56c6c; }

.distance-box { }
.distance-result {
  margin-top: 12px; padding: 12px; background: #ecf5ff; border-radius: 6px;
  display: flex; flex-direction: column; gap: 6px;
}
.distance-result b { color: #409eff; }
</style>
