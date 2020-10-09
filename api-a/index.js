require('dotenv').config()

const express = require('express')
const { fromEnv } = require('./jaeger/maketracer')
const traceMiddleware = require('./jaeger/middleware')
const openTracing = require('opentracing')

const app = express()
const tracer = fromEnv()

// set global tracer
openTracing.initGlobalTracer(tracer)

// set middleware tracer
app.use(traceMiddleware)

app.get('/ping', (req, res) => {
    return res.json(req.headers)
})

app.use('/api', require('./api'))


app.listen(8110, () => {
    console.log('Server started at :8110')
})