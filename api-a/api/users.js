const router = require('express').Router()
const opentracing = require('opentracing')
const axios = require('axios')
const { types } = require('util')
const nsq = require('nsqjs')

const w = new nsq.Writer('127.0.0.1', 4150)

w.connect()

w.on('ready', () => {
    console.log('NSQ connected')
})

w.on('closed', () => {
  console.log('NSQ closed')
})



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

    return (...args) => {
        // Node 10.x or later
        const isAsyncFunc = types.isAsyncFunction(execFunc)
        if (isAsyncFunc) {
            return execFunc(...args)
                .then(res => {
                    span.finish()
                    return res
                }).catch(err => {
                    span.addTags(opentracing.Tags.ERROR, err.message)
                    span.addTags(opentracing.Tags.SAMPLING_PRIORITY, 1)
                    span.finish()
                    throw err
                }) 
        } 

        const res = execFunc(...args)

        if (res instanceof Promise) {
            return res
                .then(res => {
                    span.finish()
                    return res
                })
                .catch(err => {
                    span.addTags(opentracing.Tags.ERROR, err.message)
                    span.addTags(opentracing.Tags.SAMPLING_PRIORITY, 1)
                    span.finish()
                })
        }
        
        return res
    }
}

const getBankAccount = ({ httpClient, rootSpan }) => async userId => {
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
    const traceId = req.tracer.span._spanContext._traceIdStr

    w.publish('OPENTRACING_INSPECTOR', {
        traceId,
        traceType: "ORDER",
    })

    const span = tracer.startSpan('detail-user', { childOf: req.tracer.span.context() })

    span.log({
        event: 'fetch',
        message: 'getting detail user'
    })

    await wrapSpan(logAccess, span)({ action: 'AccessDetailUser' })

    const user = users.find(u => u.id === Number(req.params.id))

    if (user) {
        const bankAcc = await wrapSpan(getBankAccount, span)(user.id)
        const points = await wrapSpan(getRewardPoint, span)(user.id)

        const { data: userBankData } = bankAcc
        const { data: userPointData } = points

        user.bankAccount = userBankData
        user.point = userPointData
    }

    span.finish()

    return res.json(user)
})

router.get('/', async (req, res) => {
    const span = tracer.startSpan('list-user', { childOf: req.tracer.span.context() })
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

    span.finish()
    
    return res.json(userInfos)
})

module.exports = router