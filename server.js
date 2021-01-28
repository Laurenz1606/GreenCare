require('dotenv').config()

const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')

const indexRouter = require('./routes/index')
const bundlesRouter = require('./routes/bundles')
const dashBoardRouter = require('./routes/dashboard')

let bundles = require('./Content/bundles.json')

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(methodOverride('_method'))
app.use(express.static('public'))

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, { useUnifiedTopology: true, useNewUrlParser: true })
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

app.use('/', indexRouter)
app.use('/bundles', bundlesRouter)
app.use('/dashboard', dashBoardRouter)

app.use(function (req, res) {
    res.status(404).render('404', Object.assign({}, res.locals, {
        title: 'Seite nicht gefunden',
        bundles: bundles
    }))
})

app.listen(process.env.PORT || 3000)