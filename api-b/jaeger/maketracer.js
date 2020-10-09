const tracerConf = {
    sampler: {
        type: 'const',
        param: 1
    }
}

const tracerOpts = {}

const fromEnv = (cfg = {}, opts = {}) => {
    const initTracer = require('jaeger-client').initTracerFromEnv

    return initTracer({
        ...tracerConf,
        ...cfg,
    }, {
        ...tracerOpts,
        ...opts,
    })
}

module.exports = {
    fromEnv,
}