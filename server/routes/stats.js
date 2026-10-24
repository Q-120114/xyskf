const express = require('express')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

const chronicDiseases = ['高血压', '糖尿病', '冠心病', '脑梗', '慢阻肺', '骨质疏松']
const serviceTypes = ['助餐', '助浴', '助洁', '代购', '陪同就医', '康复护理', '心理疏导', '上门探访']
const alertTypes = ['跌倒', '心率异常', '血压超标', '长时间离床', '久卧不动', 'SOS一键呼叫', '设备离线', '体温异常']
const areas = ['幸福里片区', '阳光花园片区', '康宁苑片区', '颐养园片区', '和平社区片区']
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

router.get('/dashboard', auth, async (req, res) => {
  const queries = [
    pool.query('SELECT COUNT(*) c FROM elderly'),
    pool.query('SELECT COUNT(*) c FROM elderly WHERE is_key = 1'),
    pool.query('SELECT COUNT(*) c FROM health_data WHERE device_online = 1'),
    pool.query('SELECT COUNT(*) c FROM health_data WHERE abnormal = 1'),
    pool.query('SELECT COUNT(*) c FROM staff WHERE online = 1'),
    pool.query("SELECT COUNT(*) c FROM alerts WHERE status = '待处置'"),
    pool.query("SELECT COUNT(*) c FROM orders WHERE status IN ('新建','已派单','已接单','上门中')"),
    pool.query('SELECT AVG(response_min) avg FROM alerts WHERE response_min IS NOT NULL')
  ]
  const results = await Promise.all(queries)
  const get = (i) => results[i][0][0].c
  res.json({
    totalElderly: get(0), keyElderly: get(1), monitored: get(2), abnormal: get(3),
    onlineStaff: get(4), pendingAlerts: get(5), pendingOrders: get(6),
    avgResponse: Math.round(results[7][0][0].avg || 0)
  })
})

router.get('/chronic', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT diseases FROM elderly')
  const map = {}
  chronicDiseases.forEach(d => map[d] = 0)
  rows.forEach(r => { JSON.parse(r.diseases || '[]').forEach(d => { if (map[d] != null) map[d]++ }) })
  res.json(Object.entries(map).map(([name, value]) => ({ name, value })))
})

router.get('/service-types', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT service_type FROM orders')
  const map = {}
  serviceTypes.forEach(t => map[t] = 0)
  rows.forEach(r => { if (map[r.service_type] != null) map[r.service_type]++ })
  res.json(Object.entries(map).map(([name, value]) => ({ name, value })))
})

router.get('/alert-types', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT type FROM alerts')
  const map = {}
  alertTypes.forEach(t => map[t] = 0)
  rows.forEach(r => { if (map[r.type] != null) map[r.type]++ })
  res.json(Object.entries(map).map(([name, value]) => ({ name, value })))
})

router.get('/areas', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT area FROM elderly')
  const map = {}
  areas.forEach(a => map[a] = 0)
  rows.forEach(r => { if (map[r.area] != null) map[r.area]++ })
  res.json(Object.entries(map).map(([name, value]) => ({ name, value })))
})

router.get('/monthly-trend', auth, (req, res) => {
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月']
  res.json({ months, orders: months.map(() => rand(40, 120)), alerts: months.map(() => rand(10, 50)) })
})

router.get('/weekly-response', auth, (req, res) => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  res.json({ days, avg: days.map(() => rand(5, 20)), count: days.map(() => rand(2, 15)) })
})

module.exports = router
