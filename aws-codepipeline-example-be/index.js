const express = require('express')

const app = express()
const port = process.env.PORT ?? 3000

app.get('/api', (req, res) => {
    res.send('Hello')
})

app.get('/api/health', (req, res) => {
    res.status(200).send('OK (v2)')
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
