const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    let bundles = require('../Content/bundles.json')
    res.render('bundles/index', Object.assign({}, res.locals, {
        title: 'Bundles',
        bundles: bundles
    }))
})

router.get('/:id', (req, res) => {
    let titles = []
    let bundles = require('../Content/bundles.json')
    for (var i = 0; i < bundles.length; i++) {
        titles[i] = bundles[i].title
    }
    if (titles.includes(req.params.id)) {
        var index = titles.findIndex(element => element.includes(req.params.id))
        bundles = require('../Content/bundles.json')
        res.render('index', Object.assign({}, res.locals, {
            title: titles[index],
            bundle: bundles[i]
        }))
    }
    else (
        res.status(404).render('404', Object.assign({}, res.locals, {
        title: 'Seite nicht gefunden'
    }))
    )
})

module.exports = router