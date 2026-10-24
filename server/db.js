const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const config = require('./config')

const pool = mysql.createPool(config.mysql)

async function initDB() {
  // 建库：用一个不指定 database 的临时连接创建库，避免池中连接因库不存在而无法获取
  const bootConn = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    charset: 'utf8mb4'
  })
  await bootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await bootConn.end()

  // 现在数据库已存在，池中连接可以正常获取
  await pool.query(`USE \`${config.mysql.database}\``)

  // 建表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(64) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      real_name VARCHAR(64),
      role VARCHAR(32) NOT NULL DEFAULT '护理员',
      area VARCHAR(64),
      phone VARCHAR(20),
      active TINYINT DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS elderly (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      gender VARCHAR(8),
      age INT,
      phone VARCHAR(20),
      address VARCHAR(255),
      area VARCHAR(64),
      building VARCHAR(32),
      room VARCHAR(16),
      emergency_contact VARCHAR(64),
      emergency_phone VARCHAR(20),
      care_level VARCHAR(16),
      diseases TEXT,
      allergies VARCHAR(64),
      tags TEXT,
      services TEXT,
      is_key TINYINT DEFAULT 0,
      bind_device TINYINT DEFAULT 0,
      device_type VARCHAR(64),
      lng DOUBLE,
      lat DOUBLE,
      created_at VARCHAR(32)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS health_data (
      id VARCHAR(32) PRIMARY KEY,
      elderly_id VARCHAR(32),
      hr INT,
      spo2 INT,
      sbp INT,
      dbp INT,
      bg DOUBLE,
      temp DOUBLE,
      steps INT,
      sleep INT,
      in_bed TINYINT,
      device_online TINYINT,
      abnormal TINYINT,
      risk_level VARCHAR(16),
      last_update VARCHAR(32)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(32) PRIMARY KEY,
      elderly_id VARCHAR(32),
      elderly_name VARCHAR(64),
      area VARCHAR(64),
      service_type VARCHAR(32),
      priority VARCHAR(16),
      status VARCHAR(16),
      source VARCHAR(32),
      assignee VARCHAR(64),
      created_at VARCHAR(32),
      completed_at VARCHAR(32),
      duration INT,
      rating INT,
      photos INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id VARCHAR(32) PRIMARY KEY,
      type VARCHAR(32),
      level VARCHAR(16),
      status VARCHAR(16),
      elderly_id VARCHAR(32),
      elderly_name VARCHAR(64),
      area VARCHAR(64),
      address VARCHAR(255),
      source VARCHAR(16),
      time VARCHAR(32),
      assignee VARCHAR(64),
      response_min INT,
      result VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(64),
      phone VARCHAR(20),
      role VARCHAR(32),
      area VARCHAR(64),
      skills TEXT,
      status VARCHAR(16),
      online TINYINT,
      pending_orders INT,
      completed_today INT,
      avg_response INT,
      rating DOUBLE,
      lng DOUBLE,
      lat DOUBLE,
      avatar VARCHAR(16)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id VARCHAR(32) PRIMARY KEY,
      type VARCHAR(64),
      elderly_id VARCHAR(32),
      elderly_name VARCHAR(64),
      status VARCHAR(16),
      last_online VARCHAR(32),
      battery INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user VARCHAR(64),
      action VARCHAR(128),
      time VARCHAR(32),
      ip VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // 初始化用户
  const [userRows] = await pool.query('SELECT COUNT(*) c FROM users')
  if (userRows[0].c === 0) {
    const hash = (p) => bcrypt.hashSync(p, 8)
    const users = [
      ['admin', hash('123456'), '系统管理员', '超级管理员', '全部', '13800000000', 1],
      ['manager', hash('123456'), '王主任', '社区管理员', '幸福里片区', '13900001111', 1],
      ['grid', hash('123456'), '李网格员', '网格员', '阳光花园片区', '13700002222', 1],
      ['nurse', hash('123456'), '张护理', '护理员', '康宁苑片区', '13600003333', 1],
      ['family', hash('123456'), '陈家属', '家属', '和平社区片区', '13400005555', 1]
    ]
    for (const u of users) {
      await pool.query('INSERT INTO users (username, password, real_name, role, area, phone, active) VALUES (?,?,?,?,?,?,?)', u)
    }
    console.log('✅ 初始化用户数据完成')
  }

  // 初始化业务数据
  const [eRows] = await pool.query('SELECT COUNT(*) c FROM elderly')
  if (eRows[0].c === 0) {
    await seedData()
    console.log('✅ 初始化业务数据完成')
  }
}

async function seedData() {
  const surnames = ['张','王','李','赵','刘','陈','杨','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗']
  const givenNames = ['桂芳','秀英','玉兰','秀兰','凤英','建国','志强','国华','德明','永福','淑芬','慧敏','丽娟','秀珍','梅香']
  const careLevels = ['自理','半失能','失能']
  const chronicDiseases = ['高血压','糖尿病','冠心病','脑梗','慢阻肺','骨质疏松']
  const serviceTypes = ['助餐','助浴','助洁','代购','陪同就医','康复护理','心理疏导','上门探访']
  const alertTypes = ['跌倒','心率异常','血压超标','长时间离床','久卧不动','SOS一键呼叫','设备离线','体温异常']
  const areas = ['幸福里片区','阳光花园片区','康宁苑片区','颐养园片区','和平社区片区']
  const buildings = ['1号楼','2号楼','3号楼','4号楼','5号楼','6号楼','7号楼','8号楼']
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  const pick = (arr) => arr[rand(0, arr.length - 1)]
  const genPhone = () => '1' + pick(['3','5','7','8','9']) + rand(10000000, 99999999)
  const staffNames = ['李护理','王师傅','张阿姨','刘姐','赵护理','陈大姐','孙师傅','周护理']

  const elderlyList = []
  for (let i = 0; i < 128; i++) {
    const age = rand(60, 92)
    const careLevel = pick(careLevels)
    const diseases = []
    for (let d = 0; d < rand(0, 3); d++) { const dis = pick(chronicDiseases); if (!diseases.includes(dis)) diseases.push(dis) }
    const tags = [...diseases]
    if (age >= 80) tags.push('高龄')
    if (rand(0, 10) > 6) tags.push('独居老人')
    if (rand(0, 10) > 7) tags.push('重点关爱对象')
    const services = []
    for (let s = 0; s < rand(1, 4); s++) { const st = pick(serviceTypes); if (!services.includes(st)) services.push(st) }
    const isKey = tags.includes('独居老人') || tags.includes('重点关爱对象') || careLevel === '失能'
    const e = {
      id: 'EL' + String(i + 1).padStart(4, '0'),
      name: pick(surnames) + pick(givenNames),
      gender: pick(['男','女']), age, phone: genPhone(),
      area: pick(areas), building: pick(buildings), room: rand(1, 6) + '0' + rand(1, 9),
      emergencyContact: pick(surnames) + pick(['伟','娜','磊','静','强']), emergencyPhone: genPhone(),
      careLevel, diseases: JSON.stringify(diseases),
      allergies: rand(0, 3) > 2 ? pick(['青霉素','磺胺类','海鲜','花粉']) : '无',
      tags: JSON.stringify(tags), services: JSON.stringify(services),
      isKey: isKey ? 1 : 0, bindDevice: rand(0, 10) > 1 ? 1 : 0,
      deviceType: pick(['智能手环','血压计+血糖仪','心电监测','智能床垫','人体感应+手环']),
      lng: 116.3 + Math.random() * 0.08, lat: 39.9 + Math.random() * 0.08,
      createdAt: '202' + rand(3, 5) + '-' + String(rand(1, 12)).padStart(2, '0') + '-' + String(rand(1, 28)).padStart(2, '0')
    }
    e.address = e.area + ' ' + e.building + e.room
    elderlyList.push(e)
  }
  for (const e of elderlyList) {
    await pool.query(`INSERT INTO elderly (id,name,gender,age,phone,address,area,building,room,emergency_contact,emergency_phone,care_level,diseases,allergies,tags,services,is_key,bind_device,device_type,lng,lat,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [e.id,e.name,e.gender,e.age,e.phone,e.address,e.area,e.building,e.room,e.emergencyContact,e.emergencyPhone,e.careLevel,e.diseases,e.allergies,e.tags,e.services,e.isKey,e.bindDevice,e.deviceType,e.lng,e.lat,e.createdAt])
  }

  for (const e of elderlyList) {
    const hr = rand(55, 130), spo2 = rand(88, 99), sbp = rand(90, 170), dbp = rand(55, 105)
    const bg = (rand(35, 130) / 10), temp = (rand(358, 385) / 10)
    const abnormal = hr > 110 || hr < 50 || spo2 < 92 || sbp >= 160 || sbp < 90 || bg > 11 || temp > 37.3
    await pool.query(`INSERT INTO health_data (id,elderly_id,hr,spo2,sbp,dbp,bg,temp,steps,sleep,in_bed,device_online,abnormal,risk_level,last_update) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [e.id, e.id, hr, spo2, sbp, dbp, Number(bg.toFixed(1)), Number(temp.toFixed(1)), rand(0, 8000), rand(4, 9),
        rand(0, 10) > 2 ? 1 : 0, e.bindDevice && rand(0, 10) > 1 ? 1 : 0, abnormal ? 1 : 0,
        abnormal ? (rand(0, 10) > 7 ? '高危' : '异常') : '正常', new Date(Date.now() - rand(0, 300000)).toLocaleTimeString('zh-CN')])
  }

  for (let i = 0; i < staffNames.length; i++) {
    const name = staffNames[i]
    const area = pick(areas)
    const status = i < 6 ? '在岗' : pick(['在岗','休息','服务中'])
    const skills = JSON.stringify([pick(serviceTypes), pick(serviceTypes)].filter((v, idx, a) => a.indexOf(v) === idx))
    await pool.query(`INSERT INTO staff (id,name,phone,role,area,skills,status,online,pending_orders,completed_today,avg_response,rating,lng,lat,avatar) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ['ST' + String(i + 1).padStart(4, '0'), name, genPhone(), pick(['护理员','网格员','护理员','护理员']), area, skills, status,
        status === '在岗' ? (rand(0, 10) > 1 ? 1 : 0) : 0, status === '服务中' ? rand(1, 5) : rand(0, 3), rand(0, 12),
        rand(3, 18), Number((rand(35, 50) / 10).toFixed(1)), 116.3 + Math.random() * 0.08, 39.9 + Math.random() * 0.08, pick(['李','王','张','刘','赵','陈','孙','周'])])
  }

  for (let i = 0; i < 86; i++) {
    const elder = pick(elderlyList)
    const status = pick(['新建','已派单','已接单','上门中','已完成','已评价'])
    const createdAt = new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000))
    await pool.query(`INSERT INTO orders (id,elderly_id,elderly_name,area,service_type,priority,status,source,assignee,created_at,completed_at,duration,rating,photos) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ['WO' + String(20240000 + i).padStart(8, '0'), elder.id, elder.name, elder.area, pick(serviceTypes),
        pick(['普通','普通','普通','紧急']), status, pick(['老人线上','家属上报','网格员录入','电话登记','巡检生成']),
        pick(staffNames), createdAt.toLocaleString('zh-CN'),
        status.startsWith('已完') || status === '已评价' ? new Date(createdAt.getTime() + rand(30, 180) * 60000).toLocaleString('zh-CN') : '',
        status.startsWith('已完') ? rand(20, 120) : null, status === '已评价' ? rand(3, 5) : null, status.startsWith('已完') ? rand(0, 4) : 0])
  }

  const alerts = []
  for (let i = 0; i < 42; i++) {
    const elder = pick(elderlyList)
    const type = pick(alertTypes)
    const level = type === '跌倒' || type === 'SOS一键呼叫' ? '高危' : pick(['一般','紧急','高危'])
    const status = i < 8 ? '待处置' : pick(['处置中','已结案','已结案','已结案'])
    const time = new Date(Date.now() - rand(0, 3 * 24 * 3600 * 1000))
    alerts.push({
      id: 'AL' + String(i + 1).padStart(5, '0'), type, level, status,
      elderlyId: elder.id, elderlyName: elder.name, area: elder.area, address: elder.address,
      source: type === '设备离线' ? '设备' : pick(['设备','人工上报']),
      time: time.toLocaleString('zh-CN'),
      assignee: status === '待处置' ? '' : pick(staffNames),
      responseMin: status === '已结案' ? rand(2, 45) : null,
      result: status === '已结案' ? pick(['已恢复正常','送医观察','家属已接回','现场处理完毕']) : ''
    })
  }
  alerts.sort((a, b) => (a.status === '待处置' ? -1 : 1))
  for (const a of alerts) {
    await pool.query(`INSERT INTO alerts (id,type,level,status,elderly_id,elderly_name,area,address,source,time,assignee,response_min,result) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [a.id,a.type,a.level,a.status,a.elderlyId,a.elderlyName,a.area,a.address,a.source,a.time,a.assignee,a.responseMin,a.result])
  }

  const devElderly = elderlyList.filter(e => e.bindDevice).slice(0, 30)
  for (let i = 0; i < devElderly.length; i++) {
    const e = devElderly[i]
    await pool.query(`INSERT INTO devices (id,type,elderly_id,elderly_name,status,last_online,battery) VALUES (?,?,?,?,?,?,?)`,
      ['DEV' + String(i + 1).padStart(4, '0'), e.deviceType, e.id, e.name, rand(0, 10) > 1 ? '在线' : '离线',
        new Date(Date.now() - rand(0, 600000)).toLocaleTimeString('zh-CN'), rand(10, 100)])
  }

  for (let i = 0; i < 30; i++) {
    await pool.query(`INSERT INTO system_logs (user,action,time,ip) VALUES (?,?,?,?)`,
      [pick(staffNames), pick(['登录系统','创建工单','处置告警','修改老人档案','导出报表','分配工单','更新健康阈值']),
        new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)).toLocaleString('zh-CN'), '192.168.' + rand(1, 10) + '.' + rand(1, 254)])
  }
}

module.exports = { pool, initDB }
