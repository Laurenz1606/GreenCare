const express = require('express')
const router = express.Router()
const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Bundle = require('../models/bundle')
const mongoose = require('mongoose')

// Get all user params by token
router.post('/user', async (req, res) => {
    let error = {}
    if (req.body.token) {
        let data
        data = await User.find({ apiToken: req.body.token })
        data = data[0]
        if (data == null || data == undefined) {
            error.message = 'Prüfe deinen Token'
            res.status(404).json(error)
        }
        else if (req.body.token == data.apiToken){   
            res.status(201).json(data)
        }
    }
    else {
        error.message = 'Gebe den apiToken an'
        res.status(404).json(error)
    }
})

//Get userinfo params by token
router.post('/userinfo', async (req, res) => {
    let error = {}
    if (req.body.token) {
        let data
        data = await User.find({ apiToken: req.body.token })
        data = data[0]
        if (data == null || data == undefined) {
            error.message = 'Prüfe deinen Token'
            res.status(404).json(error)
        }
        else if (req.body.token == data.apiToken){
            let infos = {}
            infos.name = data.name
            infos.email = data.email
            infos.points = data.points
            infos.bundle = {}
            if (data.activated) {
                let bundle = await Bundle.findById(data.linked)
                infos.bundle.name = bundle.Name
                infos.bundle.type = bundle.type
                infos.bundle.users = []
                infos.bundle.accounts = 0
                infos.bundle.max = bundle.accNumber
                for(const id of bundle.LinkedAccs) {
                    infos.bundle.accounts++
                    let user = await User.findById(id)
                    if(!user.private) {
                        let userInfo = {}
                        userInfo.name = user.name
                        userInfo.email = user.email
                        userInfo.points = user.points
                        infos.bundle.users.push(userInfo)
                    }
                }
            }
            res.status(201).json(infos)
        }
    }
    else {
        error.message = 'Gebe den apiToken an'
        res.status(404).json(error)
    }
})

// //Get all users
// router.get('/users', async (req, res) => {
//     data = await User.find({ private: false })
//     res.status(201).json(data)
// })

module.exports = router