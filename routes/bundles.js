const express = require('express')
const router = express.Router()

let bundles = require('../Content/bundles.json')

router.get('/', (req, res) => {
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
        res.render('bundles/show', Object.assign({}, res.locals, {
            title: bundles[index].title,
            bundle: bundles[index],
            bundles: bundles
        }))
        return
    }
    for (var i = 0; i < titles.length; i++) {
        titles[i] = titles[i].toLowerCase()
    }   
    if (titles.includes(req.params.id)) {
        var index = titles.findIndex(element => element.includes(req.params.id))
        res.redirect(capitalizeFirstLetter(bundles[index].title))
    }
    else {
        res.status(404).render('404', Object.assign({}, res.locals, {
            title: 'Seite nicht gefunden',
            bundles: bundles
        }))
    }
})

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = router