const express = require('express')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  const { keyword, status } = req.query
  let sql = 'SELECT h.*, e.name as name FROM health_data h LEFT JOIN elderly e ON h.elderly_id = e.id WHERE 1=1'
  const params = []
  if (keyword) { sql += ' AND (e.name LIKE ? OR h.elderly_id LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  if (status) {
    if (status === '离线') sql += ' AND h.device_online = 0'
    else { sql += ' AND h.risk_level = ?'; params.push(status) }
  }
  const [rows] = await pool.query(sql, params)
  res.json(rows.map(h => ({
    id: h.elderly_id, elderlyId: h.elderly_id, name: h.name, hr: h.hr, spo2: h.spo2,
    sbp: h.sbp, dbp: h.dbp, bg: h.bg, temp: h.temp, steps: h.steps, sleep: h.sleep,
    inBed: !!h.in_bed, deviceOnline: !!h.device_online, abnormal: !!h.abnormal,
    riskLevel: h.risk_level, lastUpdate: h.last_update
  })))
})

router.get('/trend/:elderlyId', auth, (req, res) => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return (d.getMonth() + 1) + '/' + d.getDate()
  })
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  res.json({
    dates,
    hr: Array.from({ length: 7 }, () => rand(60, 120)),
    sbp: Array.from({ length: 7 }, () => rand(90, 165)),
    dbp: Array.from({ length: 7 }, () => rand(55, 100)),
    spo2: Array.from({ length: 7 }, () => rand(90, 99)),
    bg: Array.from({ length: 7 }, () => rand(40, 120) / 10),
    steps: Array.from({ length: 7 }, () => rand(500, 8000))
  })
})

router.post('/threshold', auth, async (req, res) => {
  await pool.query('INSERT INTO system_logs (user, action, time, ip) VALUES (?,?,?,?)', [req.user.username, '更新健康阈值', new Date().toLocaleString('zh-CN'), req.ip])
  res.json({ message: '阈值已保存' })
})

module.exports = router
