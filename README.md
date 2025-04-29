In a Command Prompt, run Ganache CLI. The command is "ganache-cli" (all small letters)

Whenever you are updating the contract, you need to always compile the files.
From the root folder, remove the existing build folder by using the command "rmdir /s /q build".
Then run "truffle compile" to compile the contracts.
Then run "truffle migrate --reset" to run the migration scripts for the contract.

To interact with the contract directly, use Truffle Console. Use the command "truffle console" to launch Truffle Console.
