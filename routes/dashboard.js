const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()
let bundles = require('../Content/bundles.json')
const passport = require('passport')
const User = require('../models/user')
const Bundle = require('../models/bundle')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');

const initializePassport = require('./passport/passport-config')
const { findById } = require('../models/user')
initializePassport(passport,
    async email => {
        let usr = await User.find({ email: email })
        return usr[0]
    },
    async id => await User.findById(id)
)

router.get('/edit', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    usr = await User.findById(usr._id)
    res.render('dashboard/edit', Object.assign({}, res.locals, {
        title: 'Edit',
        bundles: bundles,
        userData: usr,
        private: usr.private
    }))
})

router.post('/updateUserinfo', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    usr.name = req.body.name
    if (req.body.private == 'on') {
        usr.private = true
    } else {
        usr.private = false
    }
    let updatedUser = await usr.save()
    res.redirect('/dashboard')
})

router.get('/', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    let sync = false
    let leaveError = false
    let alredy = false
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
    if (req.query.leavedis == 1) {
        leaveError = true
    }
    if (req.query.alredy == 1) {
        alredy = true
    }
    res.render('dashboard/dashboard', Object.assign({}, res.locals, {
        title: 'Dashboard',
        bundles: bundles,
        name: usr.name,
        bundle: sync,
        leaveDisable: leaveError,
        alredy: alredy
    }))
})

router.get('/search', checkAuthenticated, async (req, res) => {
    res.render('dashboard/search', Object.assign({}, res.locals, {
        title: 'Dashboard',
        bundles: bundles,
        users: [],
        error: false,
        val: ""
    }))
})

router.post('/search', checkAuthenticated, async (req, res) => {
    if (req.body.search.length >= 8) {
        let users = await User.find({ name: new RegExp(req.body.search) })
        let emails = await User.find({ email: new RegExp(req.body.search) })
        if (users.length > 0) {
            emails.forEach(emailUser => {
                var inc = false
                for (var i = 0; i < users.length; i++) {
                    if (emailUser._id.toString() == users[i]._id.toString()) {
                        inc = true
                    }
                }
                if (!inc) {
                    users.push(emailUser)
                }
            })
        } else {
            emails.forEach(emailUser => {
                users.push(emailUser)
            })
        }
        res.render('dashboard/search', Object.assign({}, res.locals, {
            title: 'Suche',
            bundles: bundles,
            users: users,
            error: false,
            val: req.body.search
        }))
    } else {
        res.render('dashboard/search', Object.assign({}, res.locals, {
            title: 'Suche',
            bundles: bundles,
            users: [],
            error: true,
            message: "Gebe mindestens 8 Buchstaben ein",
            val: req.body.search
        }))
    }
})

router.get('/bundle', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    let deletetest = false
    let deleted = []
    if (req.query.deleted) {
        deleted = await User.findById(req.query.deleted)
        deletetest = true
    }
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
                title: 'Bundle',
                bundles: bundles,
                bundle: putBundle,
                type: bundle.type,
                users: bundle.accNumber,
                linkedUsers: bundle.LinkedAccs.length,
                id: bundle._id,
                admin: true,
                adminID: adminID,
                token: bundle.token,
                isdeleted: deletetest,
                deletedUser: deleted,
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
                title: 'Bundle',
                bundles: bundles,
                bundle: putBundle,
                type: bundle.type,
                users: bundle.accNumber,
                linkedUsers: bundle.LinkedAccs.length,
                id: bundle._id,
                admin: false,
                adminID: adminID,
                isdeleted: false
            }))
        }
    } else res.redirect('/dashboard')
})

router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('dashboard/login', Object.assign({}, res.locals, {
        title: 'Anmelden',
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
        title: 'Registrieren',
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
            activated: false,
            private: false,
            apiToken: uuidv4(),
            points: between(0, 100)
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
            res.redirect('/dashboard')
        } else {
            if (result) {
                res.render('dashboard/join', Object.assign({}, res.locals, {
                    title: 'Join',
                    bundles: bundles,
                    mail: ""
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
                            if (req.body.token == bundle.token) {
                                if (linked.length < bundle.accNumber) {
                                    linked.push(usr._id)
                                    bundle.LinkedAccs = linked
                                    let savedBundle = await bundle.save()
                                    usr.activated = true
                                    usr.linked = bundle._id
                                    let savedUser = await usr.save()
                                    res.redirect('/dashboard/bundle')
                                } else {
                                    res.render('dashboard/join', Object.assign({}, res.locals, {
                                        title: 'Join',
                                        bundles: bundles,
                                        messages: {
                                            error: "Dieses Bundle ist voll"
                                        },
                                        mail: ""
                                    }))
                                }
                            } else {
                                res.render('dashboard/join', Object.assign({}, res.locals, {
                                    title: 'Join',
                                    bundles: bundles,
                                    mail: req.body.email,
                                    messages: {
                                        error: "Dein eingegebener Token ist falsch"
                                    },
                                    mail: ""
                                }))
                            }
                        } else {
                            res.render('dashboard/join', Object.assign({}, res.locals, {
                                title: 'Join',
                                bundles: bundles,
                                messages: {
                                    error: "Dieser Benutzer ist bereits in einem Bundle"
                                },
                                mail: ""
                            }))
                        }
                    } else {
                        res.render('dashboard/join', Object.assign({}, res.locals, {
                            title: 'Join',
                            bundles: bundles,
                            messages: {
                                error: "Dieder Benutzer ist bereits in diesem Bundle"
                            },
                            mail: ""
                        }))
                    }
                } else {
                    res.render('dashboard/join', Object.assign({}, res.locals, {
                        title: 'Join',
                        bundles: bundles,
                        messages: {
                            error: "Dieser Benutzer existiert nicht, wenn du dich verschrieben haben solltest, überprüfe deine Daten nocheinmal"
                        },
                        mail: ""
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
            type: req.body.type,
            token: between(100000, 999999)

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
        res.redirect('/dashboard')
    } else {
        res.redirect('/dashboard?alredy=1')
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
            bundle.token = null
            bundle.token = between(100000, 999999)
            await bundle.save()
            res.redirect('/dashboard')
        } else {
            res.redirect('/dashboard?leavedis=1')
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
        bundle.token = null
        bundle.token = between(100000, 999999)
        await bundle.save()
        res.redirect('/dashboard/bundle?deleted=' + req.body.id)
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

function between(min, max) {
    return Math.floor(
        Math.random() * (max - min) + min
    )
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