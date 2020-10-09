const router = require('express').Router()

router.use('/bank-accounts', require('./bank'))
router.use('/logging/access', require('./accesslog'))

module.exports = router