const router = require('express').Router()
const opentracing = require('opentracing')

const tracer = opentracing.globalTracer()

const pointRewardAccounts = [
    {
        userId: 1,
        point: 4653,
        lastRewardedAt: new Date()
    },
    {
        userId: 2,
        point: 8894,
        lastRewardedAt: new Date()
    },
    {
        userId: 3,
        point: 200,
        lastRewardedAt: new Date()
    }
]

router.post('/', (req, res) => {
    const user = pointRewardAccounts.find(u => u.userId === Number(req.body.userId))

    if (!user) {
        throw new Error('No user found')
    }
    

    const span = tracer.startSpan('add-point', { childOf: req.tracer.span })
    span.log({
        event: 'reward',
        message: 'Will add point reward to user:' + req.body.userId
    })

    user.point += 1

    span.log({
        event: 'reward',
        message: 'Complete add point reward to user:' + req.body.userId
    })

    return res.sendStatus(201)
})

router.get('/:id', (req, res) => {
    const user = pointRewardAccounts.find(u => u.userId === Number(req.params.id))

    if (!user) {
        throw new Error('No user found')
    }

    return res.json(user)
})

module.exports = router