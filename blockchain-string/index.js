require("dotenv").config();
const Web3 = require("web3");
const contractJson = require("./build/contracts/TransactionStorage.json");

const web3 = new Web3("http://127.0.0.1:7545");
const contractAddress = "0xBaE5D309A028445Ff4DBC32Ca4Ca8CDAE971806b"; //Pwede palitan
const contract = new web3.eth.Contract(contractJson.abi, contractAddress);

const sender = "0xA25CC872e254C60e1f2D589Ad364Cd7689aC8DD6"; //Pwede palitan

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
