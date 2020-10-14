const { initTracerFromEnv } = require('jaeger-client')

const tracerConf = {
    sampler: {
        type: 'const',
        param: 1
    }
}

const tracerOpts = {}

const fromEnv = (cfg = {}, opts = {}) => {
    const { initTracerFromEnv } = require('jaeger-client')

    return initTracerFromEnv({
        ...tracerConf,
        ...cfg,
    }, {
        ...tracerOpts,
        ...opts,
    })
}

const fromDefault = () => {
    const { initTracer } = require('jaeger-client')

    const config = {
        serviceName: 'Service B',
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            logSpans: true,
        },
    };
    const options = {
        logger: {
            info: function logInfo(msg) {
                console.log("INFO ", msg);
            },
            error: function logError(msg) {
                console.log("ERROR", msg);
            },
        },
    };

    return initTracer(config, options)
}

module.exports = {
    fromEnv,
    fromDefault,
}