const express = require('express')
const { pool } = require('../db')
const { auth } = require('./auth')

const router = express.Router()

function mapStaff(s) {
  return {
    id: s.id, name: s.name, phone: s.phone, role: s.role, area: s.area,
    skills: JSON.parse(s.skills || '[]'), status: s.status, online: !!s.online,
    pendingOrders: s.pending_orders, completedToday: s.completed_today,
    avgResponse: s.avg_response, rating: s.rating, lng: s.lng, lat: s.lat, avatar: s.avatar
  }
}

router.get('/', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM staff')
  res.json(rows.map(mapStaff))
})

router.get('/:id', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [req.params.id])
  res.json(mapStaff(rows[0]))
})

module.exports = router
