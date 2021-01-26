const dotenv = require('dotenv').config()

const express = require('express')
const router = express.Router()

router.get('/',(req, res) => {
    res.redirect(process.env.DASH_DOMAIN)
})


module.exports = router