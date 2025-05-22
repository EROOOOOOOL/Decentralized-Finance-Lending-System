In a Command Prompt, run Ganache CLI. The command is "ganache" (all small letters)

You should be in the root folder of the project (terminal-defi-app)

Whenever you update the contract, you need to always compile the files.
Run "truffle compile" to compile the contracts.
Then run "truffle migrate --reset" to run the migration scripts for the contract.
After migrating, it should show some details like the contract address.
You should look for the contract address (it is shown as this 0x000.....) and paste it in the .env file

To install all dependencies, you need to run "npm install"

Run "npm start" to start using the system

In registering an account, it requires a Eth Account and their Private Key. These can be found in the Ganache Terminal when you run it.
NOTE: Use Private Key that has the same number with the Eth Account (you'll get what i mean once you start running Ganache)

You can look for your registered accounts and your created transaction in the website of Mongo Atlas (ininvite ko na kayo don paaccept nalang kung wala pa kayo doon). Just click "Cluster" and click the "Collections" tab.

Then try the system and look for bugs.

REMINDER: Whenever you restart your Ganache terminal, you need to delete your existing account because they are using the old Eth Account. You should register a new user with the new generated Eth Account and Private Key. (Try niyo na rin ayusin to na dapat gagana parin yung system kahit old account.)





For Testing the system:

In a Command Prompt, run Ganache CLI. The command is "ganache" (all small letters)

After Ganache CLI is running,

then on another terminal,  run "truffle test test/ComprehensiveLoanManager.test.js"

This will automatically test the functionality, transaction, and the security of the system.