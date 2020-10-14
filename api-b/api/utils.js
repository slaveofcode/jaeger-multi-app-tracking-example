const opentracing = require('opentracing')
const axios = require('axios')

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

    span.finish()
    
    return execFunc
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