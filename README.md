In a Command Prompt, run Ganache CLI. The command is "ganache-cli --port 8545 --networkId 5777" (all small letters)

Whenever you are updating the contract, you need to always delete the current build folder and compile the files.
From the root folder, remove the existing build folder by using the command "rmdir /s /q build".
Then run "truffle compile" to compile the contracts.
Then run "truffle migrate --reset" to run the migration scripts for the contract.

To interact with the contract directly, use Truffle Console. Use the command "truffle console" to launch Truffle Console.

Try to create a transaction using these commands. Do it in order and per line. Do not do it in one line.

const loanManager = await LoanManager.deployed();
await loanManager.requestLoan(100, 30, "Business", "Monthly", { from: accounts[0] });
const basic = await loanManager.getLoanBasic.call(0);
const text = await loanManager.getLoanText.call(0);