const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    activated: {
        type: Boolean,
        required: true
    },
    linked: {
        type: String,
    },
    private: {
        type: Boolean,
        required: true
    }, 
    apiToken: {
        type: String,
        required: true
    }, 
    points: {
        type: Number,
        required: true
    },
    friends: {
        type: [String]
    },
    friendReqs: {
        type: [String]
    },
    pendigReqs: {
        type: [String]
    }
})

module.exports = mongoose.model('User', userSchema)