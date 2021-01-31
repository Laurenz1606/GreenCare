const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()
let bundles = require('../Content/bundles.json')
const passport = require('passport')
const User = require('../models/user')


const users = []

const initializePassport = require('./passport/passport-config')
initializePassport(passport,
    async email => {
        let usr = await User.find({ email: email })
        return usr[0]
    },
    async id => await User.findById(id)
)


router.get('/', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    res.render('dashboard/dashboard', Object.assign({}, res.locals, {
        title: 'Dashboard',
        bundles: bundles,
        name: usr.name
    }))
})

router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('dashboard/login', Object.assign({}, res.locals, {
        title: 'Login',
        bundles: bundles
    }))
})

router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/dashboard/',
    failureRedirect: '/dashboard/login',
    failureFlash: true
}))

router.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('dashboard/register', Object.assign({}, res.locals, {
        title: 'Register',
        bundles: bundles
    }))
})

router.post('/register', checkNotAuthenticated, async (req, res) => {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10)
    let usr = await User.find({ email: req.body.email })
    if (usr.length == 0) {
        const user = await new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        })
        const newUser = await user.save()
        res.redirect('/dashboard/login')
    } else {
        res.render('dashboard/register', Object.assign({}, res.locals, {
            title: 'Bundles',
            bundles: bundles,
            messages: {
                error: "Email alredy taken"
            }
        }))
    }
})

router.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/dashboard/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/dashboard/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard/')
    }
    next()
}

module.exports = router