module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache host
      port: 7545,        // Ganache port
      network_id: "*",   // Matches any network ID
    },
  },

  compilers: {
    solc: {
      version: "^0.8.17", // Ensure compatibility with Solidity 0.8.x
    },
  },
};
