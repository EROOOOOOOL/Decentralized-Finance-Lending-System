const LoanManager = artifacts.require("LoanManager");

contract("Comprehensive LoanManager Tests", accounts => {
  let loanManager;
  const [borrower, lender, attacker, thirdParty] = accounts;
  const LOAN_AMOUNT = 1000;
  const TERM_DAYS = 30;
  const PURPOSE = "Business";
  const REPAYMENT_FREQUENCY = "Monthly";

  beforeEach(async () => {
    loanManager = await LoanManager.new();
  });

  describe("Functionality Tests", () => {
    it("should create a new loan request with correct parameters", async () => {
      // Create loan request
      const tx = await loanManager.requestLoan(
        LOAN_AMOUNT,
        TERM_DAYS,
        PURPOSE,
        REPAYMENT_FREQUENCY,
        { from: borrower }
      );

      // Check transaction details
      assert(tx.receipt.status, "Transaction should be successful");
      assert(tx.logs.length > 0, "Should emit events");
      
      // Verify event details
      const event = tx.logs[0];
      assert.equal(event.event, "LoanRequested", "Should emit LoanRequested event");
      assert.equal(event.args.loanId.toNumber(), 0, "Event should have correct loan ID");
      assert.equal(event.args.borrower, borrower, "Event should have correct borrower");

      // Get loan data
      const loanBasic = await loanManager.getLoanBasic(0);
      
      // Detailed assertions for all loan parameters
      assert.equal(loanBasic[0].toNumber(), 0, "Loan ID should be 0");
      assert.equal(loanBasic[1], borrower, "Borrower address should match");
      assert.equal(loanBasic[2], "0x0000000000000000000000000000000000000000", "Initial lender should be zero address");
      assert.equal(loanBasic[3].toNumber(), LOAN_AMOUNT, "Loan amount should match");
      assert.equal(loanBasic[4].toNumber(), TERM_DAYS, "Term days should match");
      assert.equal(loanBasic[5].toNumber(), 0, "Initial status should be Requested (0)");

      // Check loan count
      const loanCount = await loanManager.getLoanCount();
      assert.equal(loanCount.toNumber(), 1, "Loan count should be 1");

      // Verify loan parameters are within expected ranges
      assert(loanBasic[3].toNumber() > 0, "Loan amount should be positive");
      assert(loanBasic[4].toNumber() > 0, "Term days should be positive");
    });

    it("should allow lender to accept loan request", async () => {
      // Create loan request
      const requestTx = await loanManager.requestLoan(LOAN_AMOUNT, TERM_DAYS, PURPOSE, REPAYMENT_FREQUENCY, { from: borrower });
      
      // Get initial state
      const initialLoanBasic = await loanManager.getLoanBasic(0);
      assert.equal(initialLoanBasic[5].toNumber(), 0, "Initial status should be Requested");

      // Accept loan
      const acceptTx = await loanManager.acceptLoan(0, { from: lender });
      
      // Verify acceptance transaction
      assert(acceptTx.receipt.status, "Accept transaction should be successful");
      assert(acceptTx.logs.length > 0, "Should emit events");
      
      // Verify acceptance event
      const event = acceptTx.logs[0];
      assert.equal(event.event, "LoanAccepted", "Should emit LoanAccepted event");
      assert.equal(event.args.loanId.toNumber(), 0, "Event should have correct loan ID");
      assert.equal(event.args.lender, lender, "Event should have correct lender");

      // Get updated loan data
      const loanBasic = await loanManager.getLoanBasic(0);
      
      // Detailed assertions for all loan parameters
      assert.equal(loanBasic[0].toNumber(), 0, "Loan ID should remain 0");
      assert.equal(loanBasic[1], borrower, "Borrower address should remain unchanged");
      assert.equal(loanBasic[2], lender, "Lender address should be updated");
      assert.equal(loanBasic[3].toNumber(), LOAN_AMOUNT, "Loan amount should remain unchanged");
      assert.equal(loanBasic[4].toNumber(), TERM_DAYS, "Term days should remain unchanged");
      assert.equal(loanBasic[5].toNumber(), 1, "Status should be Accepted (1)");

      // Verify loan count hasn't changed
      const loanCount = await loanManager.getLoanCount();
      assert.equal(loanCount.toNumber(), 1, "Loan count should remain 1");
    });
  });

  describe("Transaction Tests", () => {
    it("should handle collateral deposit correctly", async () => {
      // Setup loan
      await loanManager.requestLoan(LOAN_AMOUNT, TERM_DAYS, PURPOSE, REPAYMENT_FREQUENCY, { from: borrower });
      await loanManager.acceptLoan(0, { from: lender });

      // Get collateral amount
      const collateralAmount = await loanManager.collateralAmount();
      assert(collateralAmount > 0, "Collateral amount should be greater than 0");

      // Get initial balances
      const initialBorrowerBalance = web3.utils.toBN(await web3.eth.getBalance(borrower));
      const initialContractBalance = web3.utils.toBN(await web3.eth.getBalance(loanManager.address));
      
      // Calculate expected gas cost
      const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
      const gasEstimate = await loanManager.depositCollateral.estimateGas(0, { 
        from: borrower,
        value: collateralAmount
      });
      const expectedGasCost = gasPrice.mul(web3.utils.toBN(gasEstimate));
      
      // Deposit collateral
      const tx = await loanManager.depositCollateral(0, { 
        from: borrower,
        value: collateralAmount
      });

      // Transaction checks
      assert(tx.receipt.status, "Transaction should be successful");
      assert(tx.logs.length > 0, "Should emit events");
      
      // Verify collateral deposit event
      const event = tx.logs[0];
      assert.equal(event.event, "CollateralDeposited", "Should emit CollateralDeposited event");
      assert.equal(event.args.loanId.toNumber(), 0, "Event should have correct loan ID");
      assert.equal(event.args.borrower, borrower, "Event should have correct borrower");
      
      // Get updated loan data
      const loanBasic = await loanManager.getLoanBasic(0);
      
      // Detailed assertions
      assert.equal(loanBasic[5].toNumber(), 2, "Status should be CollateralDeposited (2)");
      
      // Check contract balance
      const finalContractBalance = web3.utils.toBN(await web3.eth.getBalance(loanManager.address));
      const expectedContractBalance = initialContractBalance.add(web3.utils.toBN(collateralAmount));
      assert(
        finalContractBalance.eq(expectedContractBalance),
        "Contract should hold collateral amount"
      );

      // Check borrower balance decreased by correct amount
      const finalBorrowerBalance = web3.utils.toBN(await web3.eth.getBalance(borrower));
      const expectedBorrowerBalance = initialBorrowerBalance.sub(web3.utils.toBN(collateralAmount));
      
      // Allow for some flexibility in gas costs
      const maxGasCost = web3.utils.toBN('1000000000000000000'); // 1 ETH max gas cost
      assert(
        finalBorrowerBalance.gte(expectedBorrowerBalance.sub(maxGasCost)),
        "Borrower balance should decrease by at least the collateral amount"
      );
    });

    it("should track loan count and handle multiple loans correctly", async () => {
      // Create first loan
      const tx1 = await loanManager.requestLoan(LOAN_AMOUNT, TERM_DAYS, PURPOSE, REPAYMENT_FREQUENCY, { from: borrower });
      assert(tx1.receipt.status, "First loan creation should succeed");
      assert(tx1.logs.length > 0, "First loan should emit event");

      // Create second loan with different parameters
      const tx2 = await loanManager.requestLoan(LOAN_AMOUNT * 2, TERM_DAYS * 2, PURPOSE, REPAYMENT_FREQUENCY, { from: borrower });
      assert(tx2.receipt.status, "Second loan creation should succeed");
      assert(tx2.logs.length > 0, "Second loan should emit event");
      
      // Check loan count
      const loanCount = await loanManager.getLoanCount();
      assert.equal(loanCount.toNumber(), 2, "Should have 2 loans");

      // Check loan details for first loan
      const loan1 = await loanManager.getLoanBasic(0);
      assert.equal(loan1[0].toNumber(), 0, "First loan ID should be 0");
      assert.equal(loan1[1], borrower, "First loan borrower should be correct");
      assert.equal(loan1[3].toNumber(), LOAN_AMOUNT, "First loan amount should be correct");
      assert.equal(loan1[4].toNumber(), TERM_DAYS, "First loan term should be correct");
      assert.equal(loan1[5].toNumber(), 0, "First loan status should be Requested");

      // Check loan details for second loan
      const loan2 = await loanManager.getLoanBasic(1);
      assert.equal(loan2[0].toNumber(), 1, "Second loan ID should be 1");
      assert.equal(loan2[1], borrower, "Second loan borrower should be correct");
      assert.equal(loan2[3].toNumber(), LOAN_AMOUNT * 2, "Second loan amount should be correct");
      assert.equal(loan2[4].toNumber(), TERM_DAYS * 2, "Second loan term should be correct");
      assert.equal(loan2[5].toNumber(), 0, "Second loan status should be Requested");

      // Verify events for both loans
      const event1 = tx1.logs[0];
      const event2 = tx2.logs[0];
      assert.equal(event1.event, "LoanRequested", "First loan should emit LoanRequested event");
      assert.equal(event2.event, "LoanRequested", "Second loan should emit LoanRequested event");
      assert.equal(event1.args.loanId.toNumber(), 0, "First loan event should have correct ID");
      assert.equal(event2.args.loanId.toNumber(), 1, "Second loan event should have correct ID");
    });
  });

  describe("Security Tests", () => {
    it("should enforce proper access control for collateral deposit", async () => {
      // Setup loan
      await loanManager.requestLoan(LOAN_AMOUNT, TERM_DAYS, PURPOSE, REPAYMENT_FREQUENCY, { from: borrower });
      await loanManager.acceptLoan(0, { from: lender });

      const collateralAmount = await loanManager.collateralAmount();

      // Try depositing as non-borrower
      try {
        await loanManager.depositCollateral(0, { 
          from: attacker,
          value: collateralAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when non-borrower tries to deposit collateral");
      }

      // Try depositing as lender
      try {
        await loanManager.depositCollateral(0, { 
          from: lender,
          value: collateralAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when lender tries to deposit collateral");
      }

      // Try depositing as third party
      try {
        await loanManager.depositCollateral(0, { 
          from: thirdParty,
          value: collateralAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when third party tries to deposit collateral");
      }

      // Try depositing with wrong amount
      try {
        await loanManager.depositCollateral(0, { 
          from: borrower,
          value: collateralAmount - 1
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when depositing wrong amount");
      }

      // Verify loan status hasn't changed
      const loanBasic = await loanManager.getLoanBasic(0);
      assert.equal(loanBasic[5].toNumber(), 1, "Status should still be Accepted");
    });

    it("should prevent invalid loan operations", async () => {
      // Try accepting non-existent loan
      try {
        await loanManager.acceptLoan(999, { from: lender });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when accepting non-existent loan");
      }

      // Create a loan
      await loanManager.requestLoan(LOAN_AMOUNT, TERM_DAYS, PURPOSE, REPAYMENT_FREQUENCY, { from: borrower });
      
      // Accept loan normally
      await loanManager.acceptLoan(0, { from: lender });

      // Try accepting again
      try {
        await loanManager.acceptLoan(0, { from: lender });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when accepting already accepted loan");
      }

      // Try accepting with different lender
      try {
        await loanManager.acceptLoan(0, { from: thirdParty });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Should revert when different lender tries to accept");
      }

      // Verify final state
      const loanBasic = await loanManager.getLoanBasic(0);
      assert.equal(loanBasic[2], lender, "Lender should remain unchanged");
      assert.equal(loanBasic[5].toNumber(), 1, "Status should remain Accepted");
    });
  });
}); 