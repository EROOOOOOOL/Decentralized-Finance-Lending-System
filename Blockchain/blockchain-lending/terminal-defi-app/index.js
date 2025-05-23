require('dotenv').config();
const mongoose = require('mongoose');
const inquirer = require('inquirer');
const bcrypt = require('bcryptjs');
const Web3 = require('web3');
const contract = require('@truffle/contract');
const User = require('./models/User');
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
      { name: 'Verify transaction on blockchain', value: 'verify' },
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
    case 'verify':
      await verifyTransaction();
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

    // Get transaction receipt
    const txReceipt = await web3.eth.getTransactionReceipt(tx.tx);
    const block = await web3.eth.getBlock(txReceipt.blockNumber);

    console.log('Loan request created successfully!');
    console.log('\nTransaction Details:');
    console.log(`Transaction Hash: ${tx.tx}`);
    console.log(`Block Number: ${txReceipt.blockNumber}`);
    console.log(`Block Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
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

    // Get transaction receipt
    const txReceipt = await web3.eth.getTransactionReceipt(tx.tx);
    const block = await web3.eth.getBlock(txReceipt.blockNumber);

    console.log('Loan funded successfully!');
    console.log('\nTransaction Details:');
    console.log(`Transaction Hash: ${tx.tx}`);
    console.log(`Block Number: ${txReceipt.blockNumber}`);
    console.log(`Block Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
    
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
    // Ensure connection is active
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.log('Unable to connect to blockchain. Please make sure Ganache is running.');
      return await showMenu();
    }

    const loanCount = await loanManagerInstance.getLoanCount();
    let foundTransactions = false;

    console.log('\nYour Transactions:');
    for (let i = 0; i < loanCount; i++) {
      const loan = await loanManagerInstance.getLoan(i);
      
      // Check if this loan involves the current user
      if (loan[0].toLowerCase() === currentUser.ethereumAddress.toLowerCase() || 
          loan[1].toLowerCase() === currentUser.ethereumAddress.toLowerCase()) {
        
        foundTransactions = true;
        const role = loan[0].toLowerCase() === currentUser.ethereumAddress.toLowerCase() ? 'Borrower' : 'Lender';
        const otherParty = role === 'Borrower' ? loan[1] : loan[0];
        const otherUser = await User.findOne({ ethereumAddress: otherParty });
        const otherUsername = otherUser ? otherUser.username : 'Unknown User';

        console.log(`
Transaction ID: ${i}
Role: ${role}
Amount: ₱${loan[2]}
Term: ${loan[3]} days
Purpose: ${loan[4]}
Repayment Frequency: ${loan[5]} days
Status: ${getStatusText(loan[6])}
Other Party: ${otherUsername} (${otherParty})
-------------------`);
      }
    }

    if (!foundTransactions) {
      console.log('No transactions found');
    }
  } catch (error) {
    console.error('Error viewing transactions:', error);
  }

  await showMenu();
}

async function verifyTransaction() {
  try {
    // Ensure connection is active
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.log('Unable to connect to blockchain. Please make sure Ganache is running.');
      return await showMenu();
    }

    // Get all loans from blockchain
    const loanCount = await loanManagerInstance.getLoanCount();
    const availableLoans = [];

    // Get all loans where current user is the lender
    for (let i = 0; i < loanCount; i++) {
      const loan = await loanManagerInstance.getLoan(i);
      if (loan[1].toLowerCase() === currentUser.ethereumAddress.toLowerCase()) {
        const borrower = await User.findOne({ ethereumAddress: loan[0] });
        availableLoans.push({
          id: i,
          borrower: loan[0],
          borrowerUsername: borrower ? borrower.username : 'Unknown',
          amount: loan[2],
          termDays: loan[3],
          purpose: loan[4],
          repaymentFrequency: loan[5],
          status: loan[6]
        });
      }
    }

    if (availableLoans.length === 0) {
      console.log('No funded loans found to verify');
      return await showMenu();
    }

    // Show available loans to verify
    console.log('\nYour Funded Loans:');
    const choices = availableLoans.map(loan => ({
      name: `ID: ${loan.id} | Amount: ₱${loan.amount} | Borrower: ${loan.borrowerUsername} | Status: ${getStatusText(loan.status)}`,
      value: loan.id
    }));

    const { loanId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'loanId',
        message: 'Select a loan to verify on blockchain:',
        choices
      }
    ]);

    // Get the selected loan details from blockchain
    const loan = await loanManagerInstance.getLoan(loanId);
    const borrower = await User.findOne({ ethereumAddress: loan[0] });
    const borrowerUsername = borrower ? borrower.username : 'Unknown';

    // Get the loan creation event
    const loanEvents = await loanManagerInstance.getPastEvents('LoanRequested', {
      filter: { loanId: loanId },
      fromBlock: 0,
      toBlock: 'latest'
    });

    if (loanEvents.length === 0) {
      console.log('\n|NONE| Verification Result: No transaction found for this loan');
      return await showMenu();
    }

    const loanEvent = loanEvents[0];
    const txReceipt = await web3.eth.getTransactionReceipt(loanEvent.transactionHash);
    const block = await web3.eth.getBlock(txReceipt.blockNumber);

    // Display verification details
    console.log('\n=== Blockchain Verification Details ===');
    console.log(`Transaction Hash: ${loanEvent.transactionHash}`);
    console.log(`Borrower: ${borrowerUsername} (${loan[0]})`);
    console.log(`Lender: ${currentUser.username} (${loan[1]})`);
    console.log(`Amount: ₱${loan[2]}`);
    console.log(`Term: ${loan[3]} days`);
    console.log(`Purpose: ${loan[4]}`);
    console.log(`Repayment Frequency: ${loan[5]} days`);
    console.log(`Status: ${getStatusText(loan[6])}`);
    console.log('=====================================');

    // Verify if the loan exists and is valid
    if (loan[1].toLowerCase() === currentUser.ethereumAddress.toLowerCase()) {
      console.log('\n|CONFIRMED| Verification Result: Transaction is valid and stored on blockchain');
      console.log('The loan details match your records and are permanently stored on the blockchain.');
      console.log(`\nBlockchain Details:`);
      console.log(`- Block Number: ${txReceipt.blockNumber}`);
      console.log(`- Transaction hash: ${loanEvent.transactionHash}`);
      console.log(`- Block timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
      console.log(`- Gas used: ${txReceipt.gasUsed}`);
      console.log(`- Block hash: ${block.hash}`);
    } else {
      console.log('\n|INVALID| Verification Result: Transaction not found or invalid');
      console.log('The loan details could not be verified on the blockchain.');
    }

  } catch (error) {
    console.error('Error verifying transaction:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
  }

  await showMenu();
}

function getStatusText(status) {
  switch (status.toString()) {
    case '0':
      return 'Requested';
    case '1':
      return 'Accepted';
    case '2':
      return 'Repaid';
    case '3':
      return 'Defaulted';
    default:
      return 'Unknown';
  }
}