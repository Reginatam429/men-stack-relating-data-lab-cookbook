const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
  }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
