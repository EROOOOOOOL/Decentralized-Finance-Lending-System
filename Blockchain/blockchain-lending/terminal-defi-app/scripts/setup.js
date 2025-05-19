const Web3 = require('web3');
const contract = require('@truffle/contract');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Connect to Ganache
    const web3 = new Web3(process.env.WEB3_PROVIDER);
    const accounts = await web3.eth.getAccounts();
    console.log('Connected to Ganache');
    console.log('Available accounts:', accounts);

    // Deploy contract
    const LoanManagerArtifact = require('../contracts/LoanManager.json');
    const LoanManager = contract(LoanManagerArtifact);
    LoanManager.setProvider(web3.currentProvider);

    const instance = await LoanManager.new({ from: accounts[0] });
    console.log('Contract deployed at:', instance.address);

    // Update .env
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${instance.address}`
    );
    fs.writeFileSync(envPath, envContent);

    // Create test users
    const lenderPassword = await bcrypt.hash('lender123', 10);
    const lender = new User({
      username: 'testlender',
      password: lenderPassword,
      role: 'lender',
      ethereumAddress: accounts[1]
    });
    await lender.save();

    const borrowerPassword = await bcrypt.hash('borrower123', 10);
    const borrower = new User({
      username: 'testborrower',
      password: borrowerPassword,
      role: 'borrower',
      ethereumAddress: accounts[2]
    });
    await borrower.save();

    console.log('\nSetup complete! Test accounts created:');
    console.log('Lender: testlender/lender123');
    console.log('Borrower: testborrower/borrower123');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();