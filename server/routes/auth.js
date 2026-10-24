const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')

const router = express.Router()
const SECRET = 'elderly-care-secret-2025'

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ message: '请输入用户名和密码' })
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
  const user = rows[0]
  if (!user) return res.status(401).json({ message: '用户不存在' })
  if (!user.active) return res.status(403).json({ message: '账号已禁用' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: '密码错误' })

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' })
  await pool.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), user.id])
  await pool.query('INSERT INTO system_logs (user, action, time, ip) VALUES (?,?,?,?)', [user.real_name || username, '登录系统', new Date().toLocaleString('zh-CN'), req.ip])

  res.json({
    token,
    user: { id: user.id, username: user.username, realName: user.real_name, role: user.role, area: user.area }
  })
})

router.post('/register', async (req, res) => {
  const { username, password, realName, role, area, phone } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码必填' })
  const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username])
  if (exists.length) return res.status(400).json({ message: '用户名已存在' })
  const hash = bcrypt.hashSync(password, 8)
  const [info] = await pool.query('INSERT INTO users (username, password, real_name, role, area, phone) VALUES (?,?,?,?,?,?)', [username, hash, realName || username, role || '护理员', area || '', phone || ''])
  res.json({ id: info.insertId, message: '注册成功' })
})

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: '未登录' })
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ message: '登录已过期' })
  }
}

router.get('/me', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, real_name, role, area, phone FROM users WHERE id = ?', [req.user.id])
  res.json(rows[0])
})

module.exports = { router, auth, SECRET }
