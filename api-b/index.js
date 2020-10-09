require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const { fromEnv } = require('./jaeger/maketracer')
const traceMiddleware = require('./jaeger/middleware')
const openTracing = require('opentracing')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const tracer = fromEnv()

// set global tracer
openTracing.initGlobalTracer(tracer)

// set middleware tracer
app.use(traceMiddleware)

app.get('/ping', (req, res) => {
    return res.json(req.headers)
})

app.use('/api', require('./api'))


app.listen(8111, () => {
    console.log('Server started at :8111')
})

process.on('SIGTERM', () => {
    debug('SIGTERM signal received: closing HTTP server')
    server.close(() => {
        debug('HTTP server closed')
        tracer.close()
    })
})