const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

router.get('/users', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, real_name, role, area, phone, active, last_login FROM users')
  res.json(rows.map(u => ({
    id: u.id,
    name: u.username,
    username: u.username,
    realName: u.real_name,
    role: u.role,
    area: u.area,
    phone: u.phone,
    active: !!u.active,
    lastLogin: u.last_login
  })))
})

router.post('/users', auth, async (req, res) => {
  const { username, password, realName, role, area, phone } = req.body
  const hash = bcrypt.hashSync(password || '123456', 8)
  const [info] = await pool.query('INSERT INTO users (username, password, real_name, role, area, phone) VALUES (?,?,?,?,?,?)', [username, hash, realName || username, role || '护理员', area || '', phone || ''])
  res.json({ id: info.insertId, message: '新增成功' })
})

router.put('/users/:id/toggle', auth, async (req, res) => {
  await pool.query('UPDATE users SET active = 1 - active WHERE id = ?', [req.params.id])
  res.json({ message: '状态已更新' })
})

router.get('/devices', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM devices')
  res.json(rows.map(d => ({ id: d.id, type: d.type, elderlyId: d.elderly_id, elderlyName: d.elderly_name, status: d.status, lastOnline: d.last_online, battery: d.battery })))
})

router.get('/logs', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM system_logs ORDER BY time DESC')
  res.json(rows)
})

module.exports = router
