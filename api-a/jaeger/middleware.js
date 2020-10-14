const openTracing = require('opentracing')

const fn = (req, res, next) => {
    const tracer = openTracing.globalTracer()

    // extract from previous trace context via headers
    const prevTraceContext = tracer.extract(
        openTracing.FORMAT_HTTP_HEADERS,
        req.headers,
    )

    // create new span
    const span = tracer.startSpan(req.path, { childOf: prevTraceContext })

    // do some logging
    span.log({
        event: 'request_started'
    })

    // record standard opentracing tagging
    span.setTag(openTracing.Tags.HTTP_METHOD, req.method)
    span.setTag(openTracing.Tags.HTTP_URL, req.path)
    span.setTag('http.full_url', req.protocol + '://' + req.get('host') + req.originalUrl)

    // prepare response headers for debugging slow response on the browser using trace ID
    const injectedHeaders = {}
    tracer.inject(span, openTracing.FORMAT_HTTP_HEADERS, injectedHeaders)
    res.set(injectedHeaders)

    // add span to the req object
    // to be used by another middleware/api handler
    Object.assign(req, { tracer: { span, injectedHeaders } })

    const finishSpan = () => {
        if (res.statusCode >= 400) {
            // collecting errors & making tags for that
            span.setTag(openTracing.Tags.SAMPLING_PRIORITY, 1)
            span.setTag(openTracing.Tags.ERROR, true)
            span.log({
                event: 'error',
                message: res.statusMessage
            })
        }

        span.setTag(openTracing.Tags.HTTP_STATUS_CODE, res.statusCode)
        span.log({
            event: 'request_ended'
        })
        span.finish()
    }

    res.on('finish', finishSpan)

    return next()
}


module.exports = fn