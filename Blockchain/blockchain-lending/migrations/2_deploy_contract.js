const TransactionStorage = artifacts.require("TransactionStorage");

module.exports = function (deployer) {
  deployer.deploy(TransactionStorage);
};
