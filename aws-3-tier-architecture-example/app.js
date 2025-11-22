require('dotenv').config() 

const express = require('express')
const mysql = require('mysql2/promise')
const fs = require('fs')
const os = require('os')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

// ===== RDS 정보 =====
// const dbConfig = {
//     host: 'your-rds-endpoint.ap-northeast-1.rds.amazonaws.com',
//     user: 'your_username',
//     password: 'your_password',
//     database: 'your_database',
// }
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
}

let pool

// ===== DB 초기화 =====
async function initDB() {
    pool = mysql.createPool(dbConfig)

    const createTable = `
    CREATE TABLE IF NOT EXISTS test (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

    const conn = await pool.getConnection()
    try {
        await conn.query(createTable)
        console.log('test 테이블 준비 완료')
    } finally {
        conn.release()
    }
}

// ===== 인스턴스 정보 =====
function getInstanceInfo() {
    const hostname = os.hostname()
    const interfaces = os.networkInterfaces()

    let privateIP = 'unknown'
    for (const iface of Object.values(interfaces)) {
        for (const detail of iface) {
            if (detail.family === 'IPv4' && !detail.internal) {
                privateIP = detail.address
            }
        }
    }

    let instanceId = 'N/A'
    try {
        instanceId = fs.readFileSync('/var/lib/cloud/data/instance-id', 'utf8').trim()
    } catch (e) {}

    return { hostname, privateIP, instanceId }
}

// ===== index.html 제공 =====
app.get('/', (req, res) => {
    const html = fs.readFileSync('./index.html', 'utf8')
    res.send(html)
})

// ===== 인스턴스 정보 API =====
app.get('/info', (req, res) => {
    res.json(getInstanceInfo())
})

// ===== DB 연결 상태 API =====
app.get('/db-status', async (req, res) => {
    try {
        const conn = await pool.getConnection()
        await conn.query('SELECT 1')
        conn.release()
        return res.json({ status: 'OK' })
    } catch (err) {
        return res.json({ status: 'ERROR', message: err.message })
    }
})

// ===== DB 저장 API (버튼 클릭 시 상태 표시용) =====
app.post('/save', async (req, res) => {
    const { content } = req.body

    if (!content) {
        return res.status(400).json({ success: false, message: 'content 값 필요' })
    }

    try {
        const conn = await pool.getConnection()
        await conn.execute('INSERT INTO test (content) VALUES (?)', [content])
        conn.release()

        return res.json({ success: true, message: '저장 성공' })
    } catch (e) {
        return res.status(500).json({ success: false, message: 'DB 저장 실패' })
    }
})

// ===== 서버 시작 =====
const PORT = process.env.PORT ?? 3000

app.listen(PORT, async () => {
    await initDB()
    console.log(`서버 실행됨 : http://localhost:${PORT}`)
})
