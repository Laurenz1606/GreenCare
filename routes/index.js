const express = require('express')
const router = express.Router()

const dotenv = require('dotenv').config()

let bundles = require('../Content/bundles.json')

router.get('/', (req, res) => {
    res.render('index', Object.assign({}, res.locals, {
        title: 'Start',
        bundles: bundles
    }))
})

module.exports = router