const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  blockchainTxHash: { type: String, required: true },
  loanId: { type: Number, required: true },
  lender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  termDays: { type: Number, required: true },
  purpose: { type: String, required: true },
  repaymentFrequency: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);