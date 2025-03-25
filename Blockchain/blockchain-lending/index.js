require("dotenv").config();
const Web3 = require("web3");
const contractJson = require("./build/contracts/TransactionStorage.json");

const web3 = new Web3("http://127.0.0.1:7545");
const contractAddress = "<DEPLOYED_CONTRACT_ADDRESS>";
const contract = new web3.eth.Contract(contractJson.abi, contractAddress);

const sender = "<YOUR_GANACHE_ACCOUNT>";

async function storeTransaction(description, amount) {
  const receipt = await contract.methods
    .storeTransaction(description, amount)
    .send({ from: sender, gas: 1000000 });

  console.log("Transaction Stored:", receipt.transactionHash);
}

async function getTransactionCount() {
  const count = await contract.methods.getTransactionCount().call();
  console.log("Total Transactions:", count);
}

async function getTransaction(index) {
  const txn = await contract.methods.getTransaction(index).call();
  console.log("Transaction Details:", txn);
}

// Example Usage
(async () => {
  await storeTransaction("Lending 100 units", 100);
  await getTransactionCount();
  await getTransaction(0);
})();
