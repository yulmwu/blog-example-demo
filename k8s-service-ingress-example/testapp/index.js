const express = require('express')
const app = express()

const HOST = process.env.HOST || '0.0.0.0'
const PORT = process.env.PORT || 3000
const GLOBAL_PREFIX = process.env.GLOBAL_PREFIX || ''

app.get(`${GLOBAL_PREFIX}/`, (req, res) => {
    res.send(`Hello from ${process.env.APP_NAME || '(unset)'}`)
})

app.get(`${GLOBAL_PREFIX}/health`, (_, res) => res.send('ok'))

app.get(`${GLOBAL_PREFIX}/cpu_load`, (req, res) => {
    const load = parseInt(req.query.load) || 1
    const duration = parseInt(req.query.duration) || 10
    const end = Date.now() + duration * 1000

    while (Date.now() < end) {
        for (let i = 0; i < load * 1e7; i++) {
            Math.sqrt(i)
        }
    }

    res.send(`Simulated CPU load of ${load} for ${duration} seconds`)
})

app.get(`${GLOBAL_PREFIX}/mem_load`, (req, res) => {
    const size = parseInt(req.query.size) || 100
    const duration = parseInt(req.query.duration) || 10
    const memoryHog = []

    for (let i = 0; i < size * 1e6; i++) {
        memoryHog.push(new Array(1000).fill('*'))
    }

    setTimeout(() => {
        res.send(`Simulated memory load of ${size}MB for ${duration} seconds`)
    }, duration * 1000)
})

app.get(`${GLOBAL_PREFIX}/crash`, () => {
    console.log('Simulating crash...')
    process.exit(1)
})

app.get(`${GLOBAL_PREFIX}/env`, (req, res) => {
    res.json(process.env)
})

app.get(`${GLOBAL_PREFIX}/headers`, (req, res) => {
    res.json(req.headers)
})

app.get(`${GLOBAL_PREFIX}/ip`, (req, res) => {
    res.send(req.ip)
})

app.get(`${GLOBAL_PREFIX}/delay`, (req, res) => {
    const duration = parseInt(req.query.duration) || 5
    setTimeout(() => {
        res.send(`Response delayed by ${duration} seconds`)
    }, duration * 1000)
})

app.listen(PORT, HOST, () => {
    console.log(`[startup] listening on ${HOST}:${PORT}, APP_NAME=${process.env.APP_NAME || '(unset)'}`)
})
