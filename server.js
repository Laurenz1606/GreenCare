require('dotenv').config()

const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')

const indexRouter = require('./routes/index')
const bundlesRouter = require('./routes/bundles')
const dashBoardRouter = require('./routes/dashboard')

let bundles = require('./Content/bundles.json')

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(express.urlencoded({ extended: false }))
app.use(expressLayouts)
app.use(methodOverride('_method'))
app.use(express.static('public'))

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, { useUnifiedTopology: true, useNewUrlParser: true })
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use('/', indexRouter)
app.use('/dashboard', dashBoardRouter)
app.use('/bundles', bundlesRouter)

app.use(function (req, res) {
    res.status(404).render('404', Object.assign({}, res.locals, {
        title: 'Seite nicht gefunden',
        bundles: bundles
    }))
})

app.listen(process.env.PORT || 3000)