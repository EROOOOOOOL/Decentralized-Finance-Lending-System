module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache host
      port: 8545,        // Ganache port
      network_id: "5777",   // Matches any network ID
    },
  },

  compilers: {
    solc: {
      version: "^0.8.17", // Ensure compatibility with Solidity 0.8.x
    },
  },
};
