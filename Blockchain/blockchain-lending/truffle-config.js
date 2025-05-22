module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache host
      port: 8545,        // Ganache port
      network_id: "*",   // Matches any network ID
      networkCheckTimeout: 10000,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },

  compilers: {
    solc: {
      version: "^0.8.17", // Ensure compatibility with Solidity 0.8.x
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  },

  mocha: {
    timeout: 100000
  }
};
