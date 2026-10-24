const express = require('express')
const cors = require('cors')
const { initDB } = require('./db')

const { router: authRouter } = require('./routes/auth')
const elderlyRouter = require('./routes/elderly')
const healthRouter = require('./routes/health')
const ordersRouter = require('./routes/orders')
const alertsRouter = require('./routes/alerts')
const staffRouter = require('./routes/staff')
const statsRouter = require('./routes/stats')
const systemRouter = require('./routes/system')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/elderly', elderlyRouter)
app.use('/api/health', healthRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/staff', staffRouter)
app.use('/api/stats', statsRouter)
app.use('/api/system', systemRouter)

app.get('/api/health-check', (req, res) => res.json({ ok: true, time: new Date().toLocaleString('zh-CN') }))

const PORT = 5000
;(async () => {
  try {
    await initDB()
    app.listen(PORT, () => {
      console.log(`🚀 养老服务后端服务已启动: http://localhost:${PORT}`)
    })
  } catch (e) {
    console.error('❌ 数据库初始化失败:', e)
  }
})()
