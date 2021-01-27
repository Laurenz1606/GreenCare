const express = require('express')
const router = express.Router()

const dotenv = require('dotenv').config()

router.get('/', (req, res) => {
    res.render('index', Object.assign({}, res.locals, {
        title: 'Start'
    }))
})

module.exports = router