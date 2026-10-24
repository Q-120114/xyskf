const express = require('express')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

function mapAlert(a) {
  return {
    id: a.id, type: a.type, level: a.level, status: a.status, elderlyId: a.elderly_id,
    elderlyName: a.elderly_name, area: a.area, address: a.address, source: a.source,
    time: a.time, assignee: a.assignee, responseMin: a.response_min, result: a.result
  }
}

router.get('/', auth, async (req, res) => {
  const { level, status } = req.query
  let sql = 'SELECT * FROM alerts WHERE 1=1'
  const params = []
  if (level) { sql += ' AND level = ?'; params.push(level) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += " ORDER BY CASE status WHEN '待处置' THEN 0 ELSE 1 END, time DESC"
  const [rows] = await pool.query(sql, params)
  res.json(rows.map(mapAlert))
})

router.put('/:id/handle', auth, async (req, res) => {
  const { status, assignee, result, responseMin } = req.body
  const fields = []
  const params = []
  if (status) { fields.push('status = ?'); params.push(status) }
  if (assignee) { fields.push('assignee = ?'); params.push(assignee) }
  if (result) { fields.push('result = ?'); params.push(result) }
  if (responseMin != null) { fields.push('response_min = ?'); params.push(responseMin) }
  params.push(req.params.id)
  await pool.query(`UPDATE alerts SET ${fields.join(', ')} WHERE id = ?`, params)
  res.json({ message: '处置已更新' })
})

module.exports = router
