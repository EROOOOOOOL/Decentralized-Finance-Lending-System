// blockchain.js - Defines the Blockchain class and displays the blockchain
const fs = require('fs');
const blockchainFile = 'blockchain.json';

class Blockchain {
    constructor() {
        this.chain = this.loadBlockchain();
    }

    loadBlockchain() {
        if (fs.existsSync(blockchainFile)) {
            return JSON.parse(fs.readFileSync(blockchainFile));
        }
        return [{ index: 0, transactions: [], previousHash: "0", hash: "genesis" }];
    }

    saveBlockchain() {
        fs.writeFileSync(blockchainFile, JSON.stringify(this.chain, null, 2));
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(transactions) {
        const previousBlock = this.getLastBlock();
        const newBlock = {
            index: previousBlock.index + 1,
            transactions,
            previousHash: previousBlock.hash,
            hash: this.generateHash(previousBlock.index + 1, transactions, previousBlock.hash)
        };
        this.chain.push(newBlock);
        this.saveBlockchain();
    }

    generateHash(index, transactions, previousHash) {
        return `${index}-${JSON.stringify(transactions)}-${previousHash}`; // Simplified hash
    }
}

const blockchain = new Blockchain();
console.log('Current Blockchain:');
console.log(JSON.stringify(blockchain.chain, null, 2));

module.exports = blockchain;
