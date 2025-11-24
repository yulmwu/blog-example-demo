const express = require('express')
const AWS = require('aws-sdk')
const path = require('path')

const app = express()
const PORT = 3000

const dynamo = new AWS.DynamoDB({ region: 'ap-northeast-2' })

let TASK_INFO = {
    taskIP: 'unknown',
}

async function loadTaskMetadata() {
    try {
        const metadataURI = process.env.ECS_CONTAINER_METADATA_URI_V4
        if (!metadataURI) return

        const res = await fetch(metadataURI)
        const meta = await res.json()

        TASK_INFO.taskIP = meta?.Networks?.[0]?.IPv4Addresses?.[0] || 'unknown'
    } catch (err) {
        TASK_INFO.taskIP = 'unknown'
    }
}

loadTaskMetadata()

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        taskIP: TASK_INFO.taskIP,
    })
})

app.get('/db', async (req, res) => {
    try {
        const tables = await dynamo.listTables().promise()
        const tableList = tables.TableNames || []

        if (tableList.length === 0) {
            return res.json({
                db: 'no-tables',
                message: 'DynamoDB를 생성하거나 최소 1개 이상의 테이블을 생성하세요.',
            })
        }

        res.json({
            db: 'connected',
            tables: tableList,
        })
    } catch (err) {
        res.status(500).json({
            db: 'error',
            message: err.message,
        })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
