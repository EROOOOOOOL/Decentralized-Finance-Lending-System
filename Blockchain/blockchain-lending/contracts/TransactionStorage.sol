// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransactionStorage {
    struct Transaction {
        address sender;
        string description;
        uint256 amount;
    }

    Transaction[] public transactions;

    event TransactionStored(address sender, string description, uint256 amount);

    /***function storeTransaction(string memory _description, uint256 _amount) public {
        transactions.push(Transaction(msg.sender, _description, _amount));
        emit TransactionStored(msg.sender, _description, _amount);
    }***/

    function getTransaction(uint index) public view returns (address, string memory, uint256) {
        Transaction memory txn = transactions[index];
        return (txn.sender, txn.description, txn.amount);
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
}
