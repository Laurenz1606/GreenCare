const express = require('express')
const router = express.Router()
const dotenv = require('dotenv').config()
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Bundle = require('../models/bundle')
const mongoose = require('mongoose')

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
            infos.friends = []
            if (data.friends.length > 0) {
                for(const id of data.friends) {
                    let user = await User.findById(id)
                    if(!user.private) {
                        let userInfo = {}
                        userInfo.name = user.name
                        userInfo.email = user.email
                        userInfo.points = user.points
                        infos.friends.push(userInfo)
                    }
                }
            }
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

module.exports = router