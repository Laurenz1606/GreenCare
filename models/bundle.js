const mongoose = require('mongoose')

const bundleSchema = new mongoose.Schema({
  accNumber: {
    type: Number,
    required: true
  },
  accs: {
    type: Array,
    required: true
  },
})

module.exports = mongoose.model('bundle', bundleSchema)