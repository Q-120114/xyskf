<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">老人档案管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="exportData">
          <el-icon><Download /></el-icon>导出档案
        </el-button>
        <el-button type="primary" @click="openDialog()">
          <el-icon><Plus /></el-icon>新增老人
        </el-button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#409eff"><el-icon><User /></el-icon></div><div><div class="stat-value">{{ list.length }}</div><div class="stat-label">老人总数</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#f56c6c"><el-icon><Star /></el-icon></div><div><div class="stat-value">{{ keyCount }}</div><div class="stat-label">重点关爱</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e6a23c"><el-icon><Warning /></el-icon></div><div><div class="stat-value">{{ aloneCount }}</div><div class="stat-label">独居老人</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#67c23a"><el-icon><CircleCheck /></el-icon></div><div><div class="stat-value">{{ selfCareCount }}</div><div class="stat-label">自理老人</div></div></div>
    </div>

    <!-- 筛选 -->
    <div class="card filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="姓名/编号">
          <el-input v-model="filters.keyword" placeholder="搜索姓名或编号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="片区">
          <el-select v-model="filters.area" placeholder="全部" clearable style="width:140px">
            <el-option v-for="a in areas" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="自理等级">
          <el-select v-model="filters.careLevel" placeholder="全部" clearable style="width:120px">
            <el-option v-for="c in careLevels" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="慢病">
          <el-select v-model="filters.disease" placeholder="全部" clearable style="width:120px">
            <el-option v-for="d in chronicDiseases" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="重点">
          <el-switch v-model="filters.keyOnly" active-text="仅重点" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <div class="card" style="margin-top:12px">
      <el-table :data="filteredList" stripe border style="width:100%" height="500">
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="phone" label="联系方式" width="120" />
        <el-table-column prop="area" label="片区" width="120" />
        <el-table-column prop="address" label="住址" min-width="160" show-overflow-tooltip />
        <el-table-column label="自理等级" width="90">
          <template #default="{ row }">
            <el-tag :type="careTagType(row.careLevel)" size="small">{{ row.careLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="慢病" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="d in row.diseases" :key="d" size="small" type="warning" style="margin:2px">{{ d }}</el-tag>
            <span v-if="!row.diseases.length" style="color:#c0c4cc">无</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="t in row.tags" :key="t" size="small" :type="t.includes('重点')||t==='独居'?'danger':'info'" style="margin:2px">{{ t }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="老人档案详情" size="500px">
      <div v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="编号">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="性别 / 年龄">{{ current.gender }} / {{ current.age }}岁</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ current.phone }}</el-descriptions-item>
          <el-descriptions-item label="住址">{{ current.address }}</el-descriptions-item>
          <el-descriptions-item label="紧急联系人">{{ current.emergencyContact }} ({{ current.emergencyPhone }})</el-descriptions-item>
          <el-descriptions-item label="自理等级">{{ current.careLevel }}</el-descriptions-item>
          <el-descriptions-item label="慢病">{{ current.diseases.join('、') || '无' }}</el-descriptions-item>
          <el-descriptions-item label="过敏史">{{ current.allergies }}</el-descriptions-item>
          <el-descriptions-item label="服务需求">{{ current.services.join('、') }}</el-descriptions-item>
          <el-descriptions-item label="绑定设备">{{ current.bindDevice ? current.deviceType : '未绑定' }}</el-descriptions-item>
        </el-descriptions>
        <el-divider>位置信息</el-divider>
        <div class="map-mini">
          <div class="map-pin" :style="{ left: pinX + '%', top: pinY + '%' }"></div>
        </div>
        <div style="text-align:center;color:#909399;font-size:12px">{{ current.area }} · {{ current.building }} · {{ current.room }}室</div>
      </div>
    </el-drawer>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑老人档案' : '新增老人档案'" width="680px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="性别"><el-radio-group v-model="form.gender"><el-radio label="男" /><el-radio label="女" /></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="年龄"><el-input-number v-model="form.age" :min="50" :max="120" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系方式"><el-input v-model="form.phone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="片区"><el-select v-model="form.area" style="width:100%"><el-option v-for="a in areas" :key="a" :label="a" :value="a" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="楼栋"><el-select v-model="form.building" style="width:100%"><el-option v-for="b in buildings" :key="b" :label="b" :value="b" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="紧急联系人"><el-input v-model="form.emergencyContact" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="紧急电话"><el-input v-model="form.emergencyPhone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="自理等级"><el-select v-model="form.careLevel" style="width:100%"><el-option v-for="c in careLevels" :key="c" :label="c" :value="c" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="慢病"><el-select v-model="form.diseases" multiple style="width:100%"><el-option v-for="d in chronicDiseases" :key="d" :label="d" :value="d" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="过敏史"><el-input v-model="form.allergies" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="服务需求"><el-select v-model="form.services" multiple style="width:100%"><el-option v-for="s in serviceTypes" :key="s" :label="s" :value="s" /></el-select></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { elderlyApi } from '../api'
import { areas, buildings, careLevels, chronicDiseases, serviceTypes } from '../constants'

const filters = reactive({ keyword: '', area: '', careLevel: '', disease: '', keyOnly: false })
const detailVisible = ref(false)
const dialogVisible = ref(false)
const current = ref(null)
const editing = ref(false)
const form = reactive({})
const list = ref([])

async function loadList() {
  const params = { ...filters }
  if (!params.keyword) delete params.keyword
  if (!params.area) delete params.area
  if (!params.careLevel) delete params.careLevel
  if (!params.disease) delete params.disease
  if (!params.keyOnly) delete params.keyOnly
  list.value = await elderlyApi.list(params)
}

onMounted(loadList)
watch(filters, loadList, { deep: true })

const keyCount = computed(() => list.value.filter(e => e.isKey).length)
const aloneCount = computed(() => list.value.filter(e => e.tags.includes('独居老人')).length)
const selfCareCount = computed(() => list.value.filter(e => e.careLevel === '自理').length)

const filteredList = computed(() => list.value)

function careTagType(level) {
  return { '自理': 'success', '半失能': 'warning', '失能': 'danger' }[level]
}

function viewDetail(row) {
  current.value = row
  detailVisible.value = true
}

function openDialog(row) {
  editing.value = !!row
  if (row) {
    Object.assign(form, JSON.parse(JSON.stringify(row)))
  } else {
    Object.assign(form, {
      name: '', gender: '男', age: 70, phone: '', area: areas[0], building: buildings[0],
      emergencyContact: '', emergencyPhone: '', careLevel: '自理', diseases: [], allergies: '无', services: []
    })
  }
  dialogVisible.value = true
}

async function save() {
  if (!form.name) { ElMessage.warning('请输入姓名'); return }
  if (editing.value) {
    await elderlyApi.update(form.id, form)
    ElMessage.success('档案已更新')
  } else {
    await elderlyApi.create(form)
    ElMessage.success('档案已新增')
  }
  dialogVisible.value = false
  loadList()
}

function remove(row) {
  ElMessageBox.confirm(`确认删除 ${row.name} 的档案？`, '提示', { type: 'warning' })
    .then(async () => {
      await elderlyApi.remove(row.id)
      ElMessage.success('已删除')
      loadList()
    })
    .catch(() => {})
}

function exportData() {
  ElMessage.success('档案导出中... (模拟)')
}

const pinX = computed(() => current.value ? 30 + Math.random() * 40 : 50)
const pinY = computed(() => current.value ? 30 + Math.random() * 40 : 50)
</script>

<style scoped>
.filter-card { margin-bottom: 0; }
.detail :deep(.el-descriptions__label) { width: 110px; }
.map-mini {
  height: 160px; background: #e6f7ff; border-radius: 8px; position: relative;
  margin-bottom: 8px; border: 1px solid #d6e4ff;
}
.map-pin {
  position: absolute; width: 16px; height: 16px; background: #f56c6c; border-radius: 50%;
  transform: translate(-50%, -50%); box-shadow: 0 0 10px #f56c6c;
}
</style>
