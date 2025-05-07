const LoanManager = artifacts.require("LoanManager");

contract("LoanManager", accounts => {
  let loanManager;
  const [borrower, lender] = accounts;

  beforeEach(async () => {
    loanManager = await LoanManager.new();
  });

  it("should create a new loan request", async () => {
    const amount = 1000;
    const termDays = 30;
    const purpose = "Business";
    const repaymentFrequency = "Monthly";

    // Create loan request
    const tx = await loanManager.requestLoan(
      amount,
      termDays,
      purpose,
      repaymentFrequency,
      { from: borrower }
    );
    console.log("Loan request transaction:", tx.tx);

    // Verify loan count
    const loanCount = await loanManager.getLoanCount();
    console.log("Loan count:", loanCount.toString());
    assert.equal(loanCount.toNumber(), 1, "Loan count should be 1");

    try {
      // Get basic loan info
      const loanBasic = await loanManager.getLoanBasic(0);
      console.log("Loan basic info:", {
        id: loanBasic[0].toString(),
        borrower: loanBasic[1],
        lender: loanBasic[2],
        amount: loanBasic[3].toString(),
        termDays: loanBasic[4].toString(),
        status: loanBasic[5].toString()
      });

      assert.equal(loanBasic[0].toNumber(), 0, "Loan ID should be 0");
      assert.equal(loanBasic[1], borrower, "Borrower address should match");
      assert.equal(loanBasic[2], "0x0000000000000000000000000000000000000000", "Lender should be zero address");
      assert.equal(loanBasic[3].toNumber(), amount, "Loan amount should match");
      assert.equal(loanBasic[4].toNumber(), termDays, "Term days should match");
      assert.equal(loanBasic[5].toNumber(), 0, "Status should be Requested (0)");

      // Get text fields using getLoanText
      const loanText = await loanManager.getLoanText(0);
      console.log("Loan text info:", {
        purpose: loanText[0],
        repaymentFrequency: loanText[1]
      });

      assert.equal(loanText[0], purpose, "Purpose should match");
      assert.equal(loanText[1], repaymentFrequency, "Repayment frequency should match");
    } catch (error) {
      console.error("Error accessing loan data:", error);
      throw error;
    }
  });

  it("should accept a loan request", async () => {
    // First create a loan request
    await loanManager.requestLoan(1000, 30, "Business", "Monthly", { from: borrower });
    
    // Accept the loan
    await loanManager.acceptLoan(0, { from: lender });

    const loanBasic = await loanManager.getLoanBasic(0);
    assert.equal(loanBasic[2], lender, "Lender address should match");
    assert.equal(loanBasic[5].toNumber(), 1, "Status should be Accepted (1)");
  });

  it("should handle collateral deposit", async () => {
    // Create and accept loan
    await loanManager.requestLoan(1000, 30, "Business", "Monthly", { from: borrower });
    await loanManager.acceptLoan(0, { from: lender });

    // Deposit collateral
    const collateralAmount = await loanManager.collateralAmount();
    await loanManager.depositCollateral(0, { 
      from: borrower,
      value: collateralAmount
    });

    const loanBasic = await loanManager.getLoanBasic(0);
    assert.equal(loanBasic[5].toNumber(), 2, "Status should be CollateralDeposited (2)");
  });
});