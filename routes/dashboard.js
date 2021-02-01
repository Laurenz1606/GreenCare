const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()
let bundles = require('../Content/bundles.json')
const passport = require('passport')
const User = require('../models/user')
const Bundle = require('../models/bundle')
const mongoose = require('mongoose')

const initializePassport = require('./passport/passport-config')
const { findById } = require('../models/user')
initializePassport(passport,
    async email => {
        let usr = await User.find({ email: email })
        return usr[0]
    },
    async id => await User.findById(id)
)


router.get('/', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    let sync = false
    if (usr.activated == true) {
        if (mongoose.Types.ObjectId.isValid(usr.linked)) {
            let bundlesync = await checkifUserinBundle(usr)
            if (bundlesync == true) {
                sync = true
            } else {
            }
        } else {
        }
    } else {
    }
    res.render('dashboard/dashboard', Object.assign({}, res.locals, {
        title: 'Dashboard',
        bundles: bundles,
        name: usr.name,
        bundle: sync
    }))
})

router.get('/bundle', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    if (usr.activated) {
        let bundle = await Bundle.findById(usr.linked)
        if (usr._id == bundle.Admin) {
            let admin = bundle.Admin
            let adminID = admin
            admin = await User.findById(admin)
            bundle.users = []
            for (let i = 0; i < bundle.LinkedAccs.length; i++) {
                let user = await User.findById(bundle.LinkedAccs[i])
                bundle.users.push(user)
            }
            let putBundle = {
                Admin: {
                    name: admin.name,
                    email: admin.email
                },
                Name: bundle.Name,
                users: bundle.users
            }
            res.render('dashboard/bundle-view', Object.assign({}, res.locals, {
                title: 'Login',
                bundles: bundles,
                bundle: putBundle,
                type: bundle.type,
                users: bundle.accNumber,
                linkedUsers: bundle.LinkedAccs.length,
                id: bundle._id,
                admin: true,
                adminID: adminID
            }))
        } else {
            let admin = bundle.Admin
            let adminID = admin
            admin = await User.findById(admin)
            bundle.users = []
            for (let i = 0; i < bundle.LinkedAccs.length; i++) {
                let user = await User.findById(bundle.LinkedAccs[i])
                bundle.users.push(user)
            }
            let putBundle = {
                Admin: {
                    name: admin.name,
                    email: admin.email
                },
                Name: bundle.Name,
                users: bundle.users
            }
            res.render('dashboard/bundle-view', Object.assign({}, res.locals, {
                title: 'Login',
                bundles: bundles,
                bundle: putBundle,
                type: bundle.type,
                users: bundle.accNumber,
                linkedUsers: bundle.LinkedAccs.length,
                id: bundle._id,
                admin: false,
                adminID: adminID
            }))
        }
    } else res.redirect('/dashboard')
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
            activated: false
        })
        const newUser = await user.save()
        res.redirect('/dashboard/login')
    } else {
        res.render('dashboard/register', Object.assign({}, res.locals, {
            title: 'Register',
            bundles: bundles,
            messages: {
                error: "Die email wird bereits verwendet, benutze bitte eine Andere"
            }
        }))
    }
})

router.get('/activate/:id', async (req, res) => {
    await Bundle.exists({ _id: req.params.id }, function (err, result) {
        if (err) {
            exists = false
            res.render('dashboard/error', Object.assign({}, res.locals, {
                title: 'Join',
                bundles: bundles,
                error: {
                    message: 'Dein Bundle existiert nicht, überprüfe deinen Link nocheinmal',
                    redirect: '/dashboard',
                    redirectLocation: 'Zurück zum Dashboard'
                }
            }))
        } else {
            if (result) {
                res.render('dashboard/join', Object.assign({}, res.locals, {
                    title: 'Join',
                    bundles: bundles
                }))
            }
        }
    })
})

router.post('/activate/:id', async (req, res) => {
    await User.exists({ email: req.body.email }, async function (err, result) {
        try {
            if (err) {
            } else {
                if (result) {
                    let bundle = await Bundle.findById(req.params.id)
                    let linked = bundle.LinkedAccs
                    let usrArray = await User.find({ email: req.body.email })
                    let usr = usrArray[0]
                    if (!bundle.LinkedAccs.includes(usr._id)) {
                        if (!usr.activated) {
                            if (linked.length < bundle.accNumber) {
                                linked.push(usr._id)
                                bundle.LinkedAccs = linked
                                let savedBundle = await bundle.save()
                                usr.activated = true
                                usr.linked = bundle._id
                                let savedUser = await usr.save()
                                res.render('dashboard/error', Object.assign({}, res.locals, {
                                    title: 'Join',
                                    bundles: bundles,
                                    error: {
                                        message: 'Du bist erfolgreich dem Bundle beigetreten',
                                        redirect: '/dashboard',
                                        redirectLocation: 'Zurück zum Dashboard'
                                    }
                                }))
                            } else {
                                res.render('dashboard/error', Object.assign({}, res.locals, {
                                    title: 'Join',
                                    bundles: bundles,
                                    error: {
                                        message: 'Dieses Bundle ist voll',
                                        redirect: '/dashboard',
                                        redirectLocation: 'Zurück zum Dashboard'
                                    }
                                }))
                            }
                        } else {
                            res.render('dashboard/error', Object.assign({}, res.locals, {
                                title: 'Join',
                                bundles: bundles,
                                error: {
                                    message: 'Du bist bereits in einem Bundle',
                                    redirect: '/dashboard',
                                    redirectLocation: 'Zurück zum Dashboard'
                                }
                            }))
                        }
                    } else {
                        res.render('dashboard/error', Object.assign({}, res.locals, {
                            title: 'Join',
                            bundles: bundles,
                            error: {
                                message: 'Du bist bereits diesem Bundle Beigetreten',
                                redirect: '/dashboard',
                                redirectLocation: 'Zurück zum Dashboard'
                            }
                        }))
                    }
                } else {
                    res.render('dashboard/error', Object.assign({}, res.locals, {
                        title: 'Join',
                        bundles: bundles,
                        error: {
                            message: 'Dein Benutzer existiert nicht, wenn du dich verschrieben haben solltest, gehe erneut auf den Link zum beitreten und gebe deine Email ein',
                            redirect: '/dashboard/register',
                            redirectLocation: 'Hier account erstellen'
                        }
                    }))
                }
            }
        } catch (e) {
        }
    })

})

router.post('/create', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    if (!usr.activated) {
        const constructedBundle = await new Bundle({
            accNumber: req.body.users,
            Admin: usr._id,
            Name: req.body.name,
            type: req.body.type
        })
        newBundle = await constructedBundle.save()
        let admin = await User.findById(newBundle.Admin)
        let linked = []
        linked.push(admin._id)
        let bundle2 = await Bundle.findById(newBundle._id)
        bundle2.LinkedAccs = linked
        newBundle = await bundle2.save()
        admin.activated = true
        admin.linked = newBundle._id
        await admin.save()
        res.render('dashboard/create-bundle', Object.assign({}, res.locals, {
            title: 'Join',
            bundles: bundles,
            admin: admin.name,
            name: newBundle.Name,
            id: newBundle._id,
            type: newBundle.type,
            users: newBundle.accNumber
        }))
    } else {
        res.render('dashboard/error', Object.assign({}, res.locals, {
            title: 'Join',
            bundles: bundles,
            error: {
                message: 'Du besitzt bereits ein Bundle',
                redirect: '/dashboard/bundle',
                redirectLocation: 'Zu deinem Bundle'
            }
        }))
    }
})

router.delete('/leave', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    if (usr.activated == true) {
        let bundle = await Bundle.findById(usr.linked)
        let linked = []
        if (usr._id != bundle.Admin) {
            let user = await User.findById(usr._id)
            for (var i = 0; i < bundle.LinkedAccs.length; i++) {
                if (usr._id != bundle.LinkedAccs[i]) {
                    linked.push(bundle.LinkedAccs[i])
                }
            }
            user.activated = false
            user.linked = ""
            await user.save()
            bundle.LinkedAccs = linked
            await bundle.save()
            res.redirect('/dashboard')
        } else {
            res.render('dashboard/error', Object.assign({}, res.locals, {
                title: 'Join',
                bundles: bundles,
                error: {
                    message: 'Du bist der Admin des Bundles, du kannst es nicht verlassen',
                    redirect: '/dashboard',
                    redirectLocation: 'Zurück zum Dashboard'
                }
            }))
        }
    } else {
        res.redirect('/dashboard')
    }
})

router.delete('/bundle/user', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    if (usr._id == req.body.Admin) {
        let user = await User.findById(req.body.id)
        let bundle = await Bundle.findById(user.linked)
        let linked = []
        for (var i = 0; i < bundle.LinkedAccs.length; i++) {
            if (user._id != bundle.LinkedAccs[i]) {
                linked.push(bundle.LinkedAccs[i])
            }
        }
        user.activated = false
        user.linked = ""
        await user.save()
        bundle.LinkedAccs = linked
        await bundle.save()
        res.redirect('/dashboard/bundle')
    }
    else {
        res.redirect('/dashboard/bundle')
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

async function checkifUserinBundle(user) {
    let bundle = await Bundle.findById(user.linked)
    if (user.linked == bundle._id && bundle.LinkedAccs.includes(user._id)) {
        return true;
    } else {
        return false;
    }
}

module.exports = router