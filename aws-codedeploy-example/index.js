const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send('Hello World! (CodeDeploy Example)')
})

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        version: '2.0.0',
    })
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
