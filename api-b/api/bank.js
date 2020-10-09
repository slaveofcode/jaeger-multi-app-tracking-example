const router = require('express').Router()
const opentracing = require('opentracing')

const tracer = opentracing.globalTracer()

const bankAccounts = [
    {
        userId: 1,
        accountName: 'Bambang Tri',
        amount: 25000000
    },
    {
        userId: 2,
        name: 'Tono Sukirman',
        amount: 4500000
    },
    {
        userId: 3,
        name: 'Tukiyem Ramayana',
        amount: 1500000
    }
]

router.get('/:id', (req, res) => {
    const span = tracer.startSpan('detail-bank-account', { childOf: req.span })
    const acc = bankAccounts.find(u => u.userId === Number(req.params.id))
    span.log({
        event: 'format',
        message: 'getting specific bank account from user id:' + req.params.id
    })
    return res.json(acc)
})

router.get('/', (req, res) => {
    const span = tracer.startSpan('list-bank-accounts', { childOf: req.span })
    span.log({
        event: 'format',
        message: 'getting all accounts'
    })
    return res.json(bankAccounts)
})

module.exports = router