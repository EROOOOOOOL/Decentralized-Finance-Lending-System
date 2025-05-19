const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['lender', 'borrower'], required: true },
  ethereumAddress: { type: String, required: true, unique: true },
  privateKey: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);