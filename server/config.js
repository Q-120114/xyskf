// MySQL 8.0 连接配置 —— 请把 PASSWORD 改成你的实际密码
module.exports = {
  mysql: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'elderly_care',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    timezone: '+08:00'
  }
}
