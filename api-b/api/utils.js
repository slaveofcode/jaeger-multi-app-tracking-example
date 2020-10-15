const opentracing = require('opentracing')
const axios = require('axios')
const { types } = require('util')

const tracer = opentracing.globalTracer()

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
            return execFunc(...args)
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

const logAccess = ({ httpClient }) => ({ serviceProvider = 'Service A', action = '',  }) => {
    return httpClient.post('http://localhost:8112/api/service/log-access', {
        serviceProvider,
        action,
        timeRequested: new Date(),
    })
}

const logging = (action, parentSpan) => {
    return wrapSpan(logAccess, parentSpan)({ action })
}

module.exports = {
    logging,
}