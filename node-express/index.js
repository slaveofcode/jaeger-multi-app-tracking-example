const express = require('express')

const app = express()

app.get('/ping', (req, res) => {
    return res.json(req.headers)
})

app.use('/api', require('./api'))


app.listen(8110, () => {
    console.log('Server started at :8110')
})