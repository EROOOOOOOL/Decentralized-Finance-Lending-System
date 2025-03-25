// transact.js - Handles creating transactions
const readline = require('readline');
const blockchain = require('./blockchain');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter sender: ', (sender) => {
    rl.question('Enter receiver: ', (receiver) => {
        rl.question('Enter amount: ', (amount) => {
            const transaction = { sender, receiver, amount: `${amount} PHP` };
            blockchain.addBlock([transaction]);
            console.log('Transaction added to the blockchain!');
            rl.close();
        });
    });
});