const express = require('express')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

function mapOrder(o) {
  return {
    id: o.id, elderlyId: o.elderly_id, elderlyName: o.elderly_name, area: o.area,
    serviceType: o.service_type, priority: o.priority, status: o.status, source: o.source,
    assignee: o.assignee, createdAt: o.created_at, completedAt: o.completed_at,
    duration: o.duration, rating: o.rating, photos: o.photos
  }
}

router.get('/', auth, async (req, res) => {
  const { keyword, type, priority, source, status } = req.query
  let sql = 'SELECT * FROM orders WHERE 1=1'
  const params = []
  if (keyword) { sql += ' AND (id LIKE ? OR elderly_name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  if (type) { sql += ' AND service_type = ?'; params.push(type) }
  if (priority) { sql += ' AND priority = ?'; params.push(priority) }
  if (source) { sql += ' AND source = ?'; params.push(source) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC'
  const [rows] = await pool.query(sql, params)
  res.json(rows.map(mapOrder))
})

router.post('/', auth, async (req, res) => {
  const b = req.body
  const id = 'WO' + Date.now()
  await pool.query(`INSERT INTO orders (id,elderly_id,elderly_name,area,service_type,priority,status,source,assignee,created_at,completed_at,duration,rating,photos)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.elderlyId, b.elderlyName || '', b.area || '', b.serviceType, b.priority || '普通', '新建', b.source || '老人线上', '', new Date().toLocaleString('zh-CN'), '', null, null, 0])
  res.json({ id, message: '工单已创建' })
})

router.put('/:id/dispatch', auth, async (req, res) => {
  const { assignee } = req.body
  await pool.query('UPDATE orders SET assignee = ?, status = ? WHERE id = ?', [assignee, '已派单', req.params.id])
  res.json({ message: '派单成功' })
})

router.put('/:id/complete', auth, async (req, res) => {
  await pool.query('UPDATE orders SET status = ?, completed_at = ?, duration = ? WHERE id = ?', ['已完成', new Date().toLocaleString('zh-CN'), Math.floor(Math.random() * 100) + 20, req.params.id])
  res.json({ message: '工单已完成' })
})

router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id])
  res.json({ message: '删除成功' })
})

module.exports = router
