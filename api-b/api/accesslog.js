const router = require('express').Router()
const opentracing = require('opentracing')

const tracer = opentracing.globalTracer()

router.post('/', (req, res) => {
    const span = tracer.startSpan('add-log', { childOf: req.span })
    span.log({
        event: 'format',
        message: 'someone accessing the bank account of user:' + req.body.userId
    })
    return res.sendStatus(200)
})

module.exports = router