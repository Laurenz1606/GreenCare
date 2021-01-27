const express = require('express')
const router = express.Router()



router.get('/',  (req, res) => {
    let bundles
        bundles = require('../Content/bundles.json')
    res.render('bundles/index', Object.assign({}, res.locals, {
        title: 'Bundles',
        bundles: bundles
    }))
})

module.exports = router