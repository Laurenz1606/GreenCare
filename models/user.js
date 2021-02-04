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
    }
})

module.exports = mongoose.model('User', userSchema)