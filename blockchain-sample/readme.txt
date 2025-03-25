Initialize a Node.js project and install dependencies:
npm init -y
---------------------------------------------------------------------------------------------------
How to Run
1. Create a Transaction
To add a new transaction to the blockchain, run:
node transact.js

You will be prompted to enter:

Sender: The name of the person sending the transaction.

Receiver: The name of the recipient.

Amount (PHP): The amount being transacted (in PHP).

Once entered, the transaction will be added to a new block in the blockchain.

2. View the Current Blockchain

To see all the blocks in the blockchain, run:

node blockchain.js

This will display the entire blockchain in JSON format.

3. View Transaction History

To see a summary of all transactions, run:

node transhistory.js

This will list all recorded transactions, block by block.
