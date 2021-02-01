const mongoose = require('mongoose')

const bundleSchema = new mongoose.Schema({
  accNumber: {
    type: Number,
    required: true
  },
  LinkedAccs: {
    type: [String]
  },
  Admin: {
    type: String, 
    required: true
  }, 
  Name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('bundle', bundleSchema)