// transhistory.js - Displays all transactions in the blockchain
const blockchainHistory = require('./blockchain');

console.log('Transaction History:');
blockchainHistory.chain.forEach(block => {
    console.log(`Block ${block.index}:`, block.transactions);
});
