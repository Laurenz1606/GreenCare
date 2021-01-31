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
    if (usr.activated == true) {
        if (mongoose.Types.ObjectId.isValid(usr.linked)) {
            let bundlesync = await checkifUserinBundle(usr)
            // console.log(bundleid)
            if (bundlesync == true) {
                console.log("Bundle in Sync")
            } else {
                console.log('Bundle not in Sync')
            }
        } else {
            console.log('Bundle not in Sync')
        }
    } else {
        console.log('No bundle for this Account')
    }
    res.render('dashboard/dashboard', Object.assign({}, res.locals, {
        title: 'Dashboard',
        bundles: bundles,
        name: usr.name
    }))
})

router.get('/bundle', checkAuthenticated, async (req, res) => {
    let usr = await req.user
    // console.log(usr)
    let bundle = await Bundle.findById(usr.linked)
    // console.log(bundle)
    let admin = bundle.Admin
    admin = await User.findById(admin)
    // console.log(bundle.LinkedAccs)
    bundle.users = []
    for (let i = 0; i < bundle.LinkedAccs.length; i++) {
        let user = await User.findById(bundle.LinkedAccs[i])
        console.log(user)
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
    console.log(putBundle)
    res.render('dashboard/bundle-view', Object.assign({}, res.locals, {
        title: 'Login',
        bundles: bundles,
        bundle: putBundle
    }))
})

router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('dashboard/login', Object.assign({}, res.locals, {
        title: 'Login',
        bundles: bundles
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
            activated: false
        })
        const newUser = await user.save()
        res.redirect('/dashboard/login')
    } else {
        res.render('dashboard/register', Object.assign({}, res.locals, {
            title: 'Bundles',
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
            //res.send('Your requested bundle does not exists')
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
                // console.log('error')
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
                                // console.log(usr)
                                // console.log(bundle._id)
                                usr.activated = true
                                usr.linked = bundle._id
                                let savedUser = await usr.save()
                                res.send('Registerd you to the bundle')
                            } else {
                                //res.send('this bundle is full')
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
                            //res.send('You are alredy in a bundle')
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
                        //res.send('You alredy joined this bundle')
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
                    //res.send('Your User does not exists')
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
            // console.log(e)
        }
    })

})

router.get('/create',  checkAuthenticated,async (req, res) => {
    let usr = await req.user
    // console.log(usr._id)
    const constructedBundle = await new Bundle({
        accNumber: 2,
        Admin: usr._id,
        Name: 'Super tolles Bundle'
    })
    newBundle = await constructedBundle.save()
    let admin = await User.findById(newBundle.Admin)
    let linked = []
    linked.push(admin._id)
    let bundle2 = await Bundle.findById(newBundle._id)
    bundle2.LinkedAccs = linked
    newBundle = await bundle2.save()
    // console.log(newBundle)
    // console.log(admin)
    admin.activated = true
    admin.linked = newBundle._id
    await admin.save()
    res.send('created bundle id: ' + newBundle._id + ' Admin: ' + admin.name + ' Name: ' + newBundle.Name)
})

router.get('/test', async (req, res) => {
    let usr = await User.findById('601706f6bf51371293ab5aa4')
    // console.log(usr)
    usr.linked = "0"
    const newUser = await usr.save()
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
    // console.log(user.linked)
    // console.log(bundle._id)
    // console.log(user._id)
    // console.log(bundle.LinkedAccs.includes(user._id))
    if (user.linked == bundle._id && bundle.LinkedAccs.includes(user._id)) {
        // console.log(true)
        return true;
    } else {
        return false;
    }
}

module.exports = router