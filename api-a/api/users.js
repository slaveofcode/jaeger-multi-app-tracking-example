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

const wrapSpan = (funcArg, parentSpan) => {
    const span = tracer.startSpan(funcArg.name, {
        childOf: parentSpan.context(),
    })

    const injectedHeaders = {}
    tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, injectedHeaders)
    
    const httpClient = axios.create({
        headers: injectedHeaders
    })

    const execFunc = funcArg({ httpClient, rootSpan: span })    

    span.finish()

    return execFunc
}

const getBankAccount = ({ httpClient, rootSpan }) => userId => {
    wrapSpan(logAccess, rootSpan)({ action: 'RequestUserBankAccount' })
        .catch(err => {})
    return httpClient.get(`http://localhost:8111/api/bank-accounts/${userId}`)
}

const getRewardPoint = ({ httpClient, rootSpan }) => userId => {
    wrapSpan(logAccess, rootSpan)({ action: 'RequestUserPoint' })
        .catch(err => {})
    return httpClient.get(`http://localhost:8111/api/reward/points/${userId}`)
}

const getUserInfo = ({ rootSpan }) => async user => {
    const bankAcc = await wrapSpan(getBankAccount, rootSpan)(user.id)
    const points = await wrapSpan(getRewardPoint, rootSpan)(user.id)

    const { data: bankData } = bankAcc
    const { data: pointData } = points

    return {
        user,
        bankData,
        pointData,
    }
}

const logAccess = ({ httpClient }) => ({ serviceProvider = 'Service A', action = '',  }) => {
    return httpClient.post('http://localhost:8112/api/service/log-access', {
        serviceProvider,
        action,
        timeRequested: new Date(),
    })
}

/**
 * const x = SomeFunc
 *  .$span({ span: parentSpan })
 *  .exec({a:1})
 */
const wrapExtension = (funcArg) => {
    const f = (...args) => {
        return this.$execute(...args)
    }

    f.$exec = (...args) => {
        const res = funcArg(...args)
    }
    
    f.$span = ({ pSpan, operationName }) => {
        let opName = funcArg.name
        if (operationName) {
            opName = operationName
        }

        if (pSpan) {
            // prepare default span
            this.span = trace.startSpan(opName, {
                childOf: pSpan.context(),
            })
            return
        }
        this.span = trace.startSpan(opName)
    }

    return f
}

router.get('/:id', async (req, res) => {
    const span = tracer.startSpan('detail-user', { childOf: req.tracer.span })

    span.log({
        event: 'fetch',
        message: 'getting detail user'
    })
    const user = users.find(u => u.id === Number(req.params.id))

    if (user) {
        const bankAcc = await wrapSpan(getBankAccount, span)(user.id)
        const points = await wrapSpan(getRewardPoint, span)(user.id)

        const { data: userBankData } = bankAcc
        const { data: userPointData } = points

        user.bankAccount = userBankData
        user.point = userPointData
    }

    // span.finish() 

    return res.json(user)
})

router.get('/', async (req, res) => {
    const span = tracer.startSpan('list-user', { childOf: req.tracer.span })
    span.log({
        event: 'fetch',
        message: 'getting all users'
    })

    wrapSpan(logAccess, span)({ action: 'AccessListUser' }).catch(err => {})

    const userInfosReqs = []
    for (const user of users) {
        userInfosReqs.push(
            wrapSpan(getUserInfo, span)(user)
        )
    }

    const userInfos = await Promise.all(userInfosReqs)
    
    return res.json(userInfos)
})

module.exports = router