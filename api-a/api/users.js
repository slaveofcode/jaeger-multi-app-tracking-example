const router = require('express').Router()
const opentracing = require('opentracing')

const tracer = opentracing.globalTracer()

const users = [
    {
        id: 1,
        name: 'Bambang',
        age: 25
    },
    {
        id: 2,
        name: 'Tono',
        age: 19
    },
    {
        id: 3,
        name: 'Tukiyem',
        age: 30
    }
]

router.get('/:id', (req, res) => {
    const span = tracer.startSpan('detail-user', { childOf: req.span })
    const user = users.find(u => u.id === Number(req.params.id))
    span.log({
        event: 'format',
        message: 'getting detail user'
    })
    return res.json(user)
})

router.get('/', (req, res) => {
    const span = tracer.startSpan('detail-user', { childOf: req.span })
    span.log({
        event: 'format',
        message: 'getting all user'
    })
    return res.json(users)
})

module.exports = router