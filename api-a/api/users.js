const router = require('express').Router()
const opentracing = require('opentracing')
const axios = require('axios')

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

router.get('/:id', async (req, res) => {
    const span = tracer.startSpan('detail-user', { childOf: req.span })
    span.log({
        event: 'format',
        message: 'getting detail user'
    })
    const user = users.find(u => u.id === Number(req.params.id))

    if (user) {
        const { injectedHeaders } = req.tracer
        const [bankAcc,] = await Promise.all([
            axios.get(`http://localhost:8111/api/bank-accounts/${user.id}`, {
                headers: injectedHeaders
            }),
            axios.post('http://localhost:8111/api/logging/access', {userId: user.id}, {
                headers: injectedHeaders
            })
        ])

        const { status, data } = bankAcc

        if (status === 200) {
            user.bankAccount = data
        }
    }

    return res.json(user)
})

router.get('/', (req, res) => {
    const span = tracer.startSpan('list-user', { childOf: req.span })
    span.log({
        event: 'format',
        message: 'getting all user'
    })
    return res.json(users)
})

module.exports = router