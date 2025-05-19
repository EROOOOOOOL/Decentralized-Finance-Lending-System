require('dotenv').config();
const mongoose = require('mongoose');
const inquirer = require('inquirer');
const bcrypt = require('bcryptjs');
const Web3 = require('web3');
const contract = require('@truffle/contract');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const LoanManagerArtifact = require('./build/contracts/LoanManager.json');

// Initialize Web3 and contract
let web3;
let LoanManager;
let loanManagerInstance;
let currentUser = null;

// Add this function to check and maintain the connection
async function ensureConnection() {
  try {
    if (!web3 || !web3.eth) {
      web3 = new Web3(process.env.WEB3_PROVIDER);
    }
    
    // Test the connection
    await web3.eth.getAccounts();
    
    if (!LoanManager) {
      LoanManager = contract(LoanManagerArtifact);
      LoanManager.setProvider(web3.currentProvider);
    }
    
    if (!loanManagerInstance) {
      loanManagerInstance = await LoanManager.at(process.env.CONTRACT_ADDRESS);
    }
    
    return true;
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  }
}

// Connect to MongoDB and initialize contract
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  const isConnected = await ensureConnection();
  if (isConnected) {
    console.log('Connected to blockchain network');
    await showWelcomeMenu();
  } else {
    console.error('Failed to connect to blockchain network');
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});

async function showWelcomeMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Welcome to DeFi Lending System. What would you like to do?',
      choices: [
        { name: 'Login', value: 'login' },
        { name: 'Register', value: 'register' }
      ]
    }
  ]);

  if (action === 'login') {
    await login();
  } else {
    await register();
  }
}

async function register() {
  try {
    const { username, password, role, ethereumAddress, privateKey } = await inquirer.prompt([
      { type: 'input', name: 'username', message: 'Enter username:' },
      { type: 'password', name: 'password', message: 'Enter password:' },
      { 
        type: 'list', 
        name: 'role', 
        message: 'Select role:', 
        choices: ['lender', 'borrower'] 
      },
      { 
        type: 'input', 
        name: 'ethereumAddress', 
        message: 'Enter Ethereum address:',
        validate: input => input.startsWith('0x') && input.length === 42 ? true : 'Invalid Ethereum address'
      },
      {
        type: 'password',
        name: 'privateKey',
        message: 'Enter private key (from Ganache):',
        validate: input => input.startsWith('0x') && input.length === 66 ? true : 'Invalid private key'
      }
    ]);

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Username already exists. Please try again.');
      return await showWelcomeMenu();
    }

    // Check if ethereum address already exists
    const existingAddress = await User.findOne({ ethereumAddress });
    if (existingAddress) {
      console.log('Ethereum address already registered. Please try again.');
      return await showWelcomeMenu();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      role,
      ethereumAddress,
      privateKey
    });

    await user.save();
    console.log('Registration successful! Please login.');
    await showWelcomeMenu();
  } catch (error) {
    console.error('Error during registration:', error);
    await showWelcomeMenu();
  }
}

async function login() {
  try {
    const { username, password } = await inquirer.prompt([
      { type: 'input', name: 'username', message: 'Enter username:' },
      { type: 'password', name: 'password', message: 'Enter password:' }
    ]);

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('Invalid credentials');
      return await showWelcomeMenu();
    }

    currentUser = user;
    console.log(`Welcome ${user.username} (${user.role})!`);
    await showMenu();
  } catch (error) {
    console.error('Error during login:', error);
    await showWelcomeMenu();
  }
}

async function showMenu() {
  let options = [];
  
  if (currentUser.role === 'lender') {
    options = [
      { name: 'Browse loan requests from borrowers', value: 'browse' },
      { name: 'View my funded loans', value: 'view' },
      { name: 'Sign out', value: 'logout' }
    ];
  } else {
    options = [
      { name: 'Create new loan request', value: 'create' },
      { name: 'View my loan requests', value: 'view' },
      { name: 'Sign out', value: 'logout' }
    ];
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: options
    }
  ]);

  switch (action) {
    case 'create':
      await createLoanRequest();
      break;
    case 'browse':
      await browseLoans();
      break;
    case 'view':
      await viewTransactions();
      break;
    case 'logout':
      currentUser = null;
      console.log('Logged out successfully');
      await showWelcomeMenu();
      break;
  }
}

async function createLoanRequest() {
  const { amount, termDays, purpose, repaymentFrequency } = await inquirer.prompt([
    { 
      type: 'number', 
      name: 'amount', 
      message: 'Enter loan amount (in PHP):',
      validate: input => input > 0 ? true : 'Amount must be greater than 0'
    },
    { 
      type: 'number', 
      name: 'termDays', 
      message: 'Enter term in days:',
      validate: input => input > 0 ? true : 'Term must be greater than 0'
    },
    { type: 'input', name: 'purpose', message: 'Enter loan purpose:' },
    { 
      type: 'input', 
      name: 'repaymentFrequency', 
      message: 'Enter repayment frequency (in days):',
      validate: input => input > 0 ? true : 'Frequency must be greater than 0'
    }
  ]);

  try {
    // Ensure connection is active
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.log('Unable to connect to blockchain. Please make sure Ganache is running.');
      return await showMenu();
    }

    // Clear any existing accounts
    web3.eth.accounts.wallet.clear();
    
    // Add the account with the private key
    const account = web3.eth.accounts.privateKeyToAccount(currentUser.privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // Set the default account
    web3.eth.defaultAccount = account.address;

    console.log('Creating loan request with account:', account.address);

    // Create loan request on blockchain
    const tx = await loanManagerInstance.requestLoan(
      amount,
      termDays,
      purpose,
      repaymentFrequency,
      { 
        from: account.address,
        gas: 3000000
      }
    );

    // Get loan ID from event
    const loanId = await loanManagerInstance.getLoanCount() - 1;
    console.log('Created loan with ID:', loanId);

    // Verify the loan was created
    const loan = await loanManagerInstance.getLoan(loanId);
    console.log('Created loan details:', {
      borrower: loan[0],
      status: loan[6],
      amount: loan[2],
      termDays: loan[3],
      purpose: loan[4]
    });

    // Store in MongoDB
    const transaction = new Transaction({
      blockchainTxHash: tx.tx,
      loanId,
      borrower: currentUser._id,
      amount,
      termDays,
      purpose,
      repaymentFrequency,
      status: 'Requested'
    });

    await transaction.save();
    console.log('Loan request created successfully!');
  } catch (error) {
    console.error('Error creating loan request:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
  }

  await showMenu();
}

async function browseLoans() {
  try {
    // Ensure connection is active
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.log('Unable to connect to blockchain. Please make sure Ganache is running.');
      return await showMenu();
    }

    // Clear any existing accounts
    web3.eth.accounts.wallet.clear();
    
    // Add the account with the private key
    const account = web3.eth.accounts.privateKeyToAccount(currentUser.privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // Set the default account
    web3.eth.defaultAccount = account.address;

    const loanCount = await loanManagerInstance.getLoanCount();
    const availableLoans = [];

    for (let i = 0; i < loanCount; i++) {
      const loan = await loanManagerInstance.getLoan(i);
      
      // Only show loan requests (status 0) that were created by borrowers
      if (loan[6].toString() === '0') {  // Status 0 means Requested
        // Get borrower's username from the database
        const borrower = await User.findOne({ ethereumAddress: loan[0] });
        
        // Only show if the borrower exists and is not the current user
        if (borrower && 
            borrower.role === 'borrower' && 
            borrower.ethereumAddress.toLowerCase() !== currentUser.ethereumAddress.toLowerCase()) {
          
          availableLoans.push({
            id: i,
            borrower: loan[0],
            borrowerUsername: borrower.username,
            amount: loan[2],
            termDays: loan[3],
            purpose: loan[4],
            repaymentFrequency: loan[5]
          });
        }
      }
    }

    if (availableLoans.length === 0) {
      console.log('No available loan requests from borrowers found');
      return await showMenu();
    }

    console.log('\nAvailable Loan Requests:');
    const choices = availableLoans.map(loan => ({
      name: `Amount: ₱${loan.amount}, Term: ${loan.termDays} days, Purpose: ${loan.purpose}, Repayment: ${loan.repaymentFrequency} days`,
      value: loan.id
    }));

    const { loanId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'loanId',
        message: 'Select a loan request to fund:',
        choices
      }
    ]);

    // Confirm loan funding
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to fund this loan request?',
        default: false
      }
    ]);

    if (!confirm) {
      console.log('Loan funding cancelled');
      return await showMenu();
    }

    // Fund loan on blockchain
    const tx = await loanManagerInstance.acceptLoan(loanId, { 
      from: account.address,
      gas: 3000000
    });

    // Update MongoDB
    const selectedLoan = availableLoans.find(loan => loan.id === loanId);
    const borrower = await User.findOne({ ethereumAddress: selectedLoan.borrower });
    
    const transaction = new Transaction({
      blockchainTxHash: tx.tx,
      loanId,
      lender: currentUser._id,
      borrower: borrower._id,
      amount: selectedLoan.amount,
      termDays: selectedLoan.termDays,
      purpose: selectedLoan.purpose,
      repaymentFrequency: selectedLoan.repaymentFrequency,
      status: 'Accepted'
    });

    await transaction.save();
    console.log('Loan funded successfully!');
    
    // After funding, show the funded loans
    await viewTransactions();
  } catch (error) {
    console.error('Error browsing loans:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
  }

  await showMenu();
}

async function viewTransactions() {
  try {
    let transactions;
    if (currentUser.role === 'lender') {
      transactions = await Transaction.find({ lender: currentUser._id })
        .populate('borrower', 'username');
    } else {
      transactions = await Transaction.find({ borrower: currentUser._id })
        .populate('lender', 'username');
    }

    if (transactions.length === 0) {
      console.log('No transactions found');
      return await showMenu();
    }

    console.log('\nYour Transactions:');
    transactions.forEach(tx => {
      if (currentUser.role === 'lender') {
        console.log(`\nAmount: ₱${tx.amount}`);
        console.log(`Term: ${tx.termDays} days`);
        console.log(`Purpose: ${tx.purpose}`);
        console.log(`Repayment: ${tx.repaymentFrequency} days`);
        console.log(`Status: ${tx.status}`);
        console.log(`Borrower: ${tx.borrower.username}`);
      } else {
        console.log(`\nAmount: ₱${tx.amount}`);
        console.log(`Term: ${tx.termDays} days`);
        console.log(`Purpose: ${tx.purpose}`);
        console.log(`Repayment: ${tx.repaymentFrequency} days`);
        console.log(`Status: ${tx.status}`);
        console.log(`Lender: ${tx.lender.username}`);
      }
    });
  } catch (error) {
    console.error('Error viewing transactions:', error);
  }

  await showMenu();
}

async function viewTransactions() {
  try {
    let transactions;
    if (currentUser.role === 'lender') {
      transactions = await Transaction.find({
        lender: currentUser._id
      }).sort({ createdAt: -1 });
    } else {
      transactions = await Transaction.find({
        borrower: currentUser._id
      }).sort({ createdAt: -1 });
    }

    if (transactions.length === 0) {
      console.log('No transactions found');
      return await showMenu();
    }

    console.log('\nYour Transactions:');
    for (const tx of transactions) {
      const loan = await loanManagerInstance.getLoan(tx.loanId);
      const role = tx.lender && tx.lender.toString() === currentUser._id.toString() ? 'Lender' : 'Borrower';
      const otherParty = role === 'Lender' ? loan[1] : loan[0];
      const otherUser = await User.findOne({ ethereumAddress: otherParty });
      const otherUsername = otherUser ? otherUser.username : 'Unknown User';

      console.log(`
Transaction ID: ${tx.blockchainTxHash}
Role: ${role}
Amount: ₱${loan[2]}
Term: ${loan[3]} days
Purpose: ${loan[4]}
Repayment Frequency: ${loan[5]} days
Status: ${getStatusText(loan[6])}
Other Party: ${otherUsername} (${otherParty})
Date: ${tx.createdAt.toLocaleString()}
-------------------`);
    }
  } catch (error) {
    console.error('Error viewing transactions:', error);
  }

  await showMenu();
}

function getStatusText(status) {
  switch (status) {
    case 0: return 'Requested';
    case 1: return 'Accepted';
    case 2: return 'Completed';
    case 3: return 'Defaulted';
    default: return 'Unknown';
  }
}