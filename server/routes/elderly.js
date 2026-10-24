const express = require('express')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

function parseElderly(e) {
  if (!e) return e
  return {
    id: e.id,
    name: e.name,
    gender: e.gender,
    age: e.age,
    phone: e.phone,
    address: e.address,
    area: e.area,
    building: e.building,
    room: e.room,
    emergencyContact: e.emergency_contact,
    emergencyPhone: e.emergency_phone,
    careLevel: e.care_level,
    diseases: JSON.parse(e.diseases || '[]'),
    allergies: e.allergies,
    tags: JSON.parse(e.tags || '[]'),
    services: JSON.parse(e.services || '[]'),
    isKey: !!e.is_key,
    bindDevice: !!e.bind_device,
    deviceType: e.device_type,
    lng: e.lng,
    lat: e.lat,
    createdAt: e.created_at
  }
}

router.get('/', auth, async (req, res) => {
  const { keyword, area, careLevel, disease, keyOnly } = req.query
  let sql = 'SELECT * FROM elderly WHERE 1=1'
  const params = []
  if (keyword) { sql += ' AND (name LIKE ? OR id LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  if (area) { sql += ' AND area = ?'; params.push(area) }
  if (careLevel) { sql += ' AND care_level = ?'; params.push(careLevel) }
  if (disease) { sql += ' AND diseases LIKE ?'; params.push(`%${disease}%`) }
  if (keyOnly === 'true') { sql += ' AND is_key = 1' }
  const [rows] = await pool.query(sql, params)
  res.json(rows.map(parseElderly))
})

router.get('/:id', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM elderly WHERE id = ?', [req.params.id])
  res.json(parseElderly(rows[0]))
})

router.post('/', auth, async (req, res) => {
  const b = req.body
  const id = b.id || ('EL' + Date.now())
  await pool.query(`INSERT INTO elderly (id,name,gender,age,phone,address,area,building,room,emergency_contact,emergency_phone,care_level,diseases,allergies,tags,services,is_key,bind_device,device_type,lng,lat,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.name, b.gender || '男', b.age || 70, b.phone || '', b.address || '', b.area || '', b.building || '', b.room || '',
      b.emergencyContact || '', b.emergencyPhone || '', b.careLevel || '自理', JSON.stringify(b.diseases || []),
      b.allergies || '无', JSON.stringify(b.tags || []), JSON.stringify(b.services || []), b.isKey ? 1 : 0,
      b.bindDevice ? 1 : 0, b.deviceType || '', 116.3 + Math.random() * 0.08, 39.9 + Math.random() * 0.08, new Date().toLocaleString('zh-CN')])
  res.json({ id, message: '新增成功' })
})

router.put('/:id', auth, async (req, res) => {
  const b = req.body
  await pool.query(`UPDATE elderly SET name=?,gender=?,age=?,phone=?,address=?,area=?,building=?,room=?,emergency_contact=?,emergency_phone=?,care_level=?,diseases=?,allergies=?,tags=?,services=?,is_key=?,bind_device=?,device_type=? WHERE id=?`,
    [b.name, b.gender, b.age, b.phone, b.address, b.area, b.building, b.room, b.emergencyContact, b.emergencyPhone,
      b.careLevel, JSON.stringify(b.diseases || []), b.allergies, JSON.stringify(b.tags || []), JSON.stringify(b.services || []),
      b.isKey ? 1 : 0, b.bindDevice ? 1 : 0, b.deviceType, req.params.id])
  res.json({ message: '更新成功' })
})

router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM elderly WHERE id = ?', [req.params.id])
  await pool.query('DELETE FROM health_data WHERE elderly_id = ?', [req.params.id])
  res.json({ message: '删除成功' })
})

module.exports = router
