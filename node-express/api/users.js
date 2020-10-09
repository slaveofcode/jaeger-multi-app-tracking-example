const router = require('express').Router()

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

router.get('/:id', (req, res) => {
    const user = users.find(u => u.id === Number(req.params.id))
    return res.json(user)
})

router.get('/', (_, res) => {
    return res.json(users)
})

module.exports = router