const router = require('express').Router()

router.use('/bank-accounts', require('./bank'))
router.use('/reward/points', require('./point-reward'))

module.exports = router