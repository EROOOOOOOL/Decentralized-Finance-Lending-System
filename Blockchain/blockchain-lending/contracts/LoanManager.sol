// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract LoanManager {
    uint public collateralAmount = 1000; // Example collateral
    uint public interestRate = 5; // 5%

    enum LoanStatus { Requested, Accepted, CollateralDeposited, Funded, Completed, Cancelled }

    struct Loan {
        uint id;
        address borrower;
        address lender;
        uint amount;
        uint termDays;
        string purpose;
        string repaymentFrequency;
        LoanStatus status;
    }

    Loan[] public loans;
    uint public loanCount;

    event LoanRequested(uint loanId, address borrower);
    event LoanAccepted(uint loanId, address lender);
    event CollateralDeposited(uint loanId, address borrower);
    event LoanFunded(uint loanId, address lender);
    event LoanCompleted(uint loanId);

    // Request a new loan
    function requestLoan(
        uint amount,
        uint termDays,
        string memory purpose,
        string memory repaymentFrequency
    ) public {
        require(amount > 0, "Amount must be greater than 0");
        require(termDays > 0, "Term days must be greater than 0");
        require(bytes(purpose).length > 0, "Purpose cannot be empty");
        require(bytes(repaymentFrequency).length > 0, "Repayment frequency cannot be empty");

        uint newLoanId = loanCount;
        loans.push(Loan({
            id: newLoanId,
            borrower: msg.sender,
            lender: address(0),
            amount: amount,
            termDays: termDays,
            purpose: purpose,
            repaymentFrequency: repaymentFrequency,
            status: LoanStatus.Requested
        }));

        emit LoanRequested(newLoanId, msg.sender);
        loanCount++;
    }

    // Accept a loan request
    function acceptLoan(uint loanId) public {
        require(loanId < loanCount, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Requested, "Loan is not available");
        
        loan.lender = msg.sender;
        loan.status = LoanStatus.Accepted;

        emit LoanAccepted(loanId, msg.sender);
    }

    // Deposit collateral by borrower
    function depositCollateral(uint loanId) public payable {
        require(loanId < loanCount, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        require(msg.sender == loan.borrower, "Only borrower can deposit collateral");
        require(msg.value >= collateralAmount, "Insufficient collateral");

        loan.status = LoanStatus.CollateralDeposited;
        emit CollateralDeposited(loanId, msg.sender);
    }

    // Fund the loan by lender
    function fundLoan(uint loanId) public payable {
        require(loanId < loanCount, "Invalid loan ID");
        Loan storage loan = loans[loanId];
        require(msg.sender == loan.lender, "Only lender can fund the loan");
        require(loan.status == LoanStatus.CollateralDeposited, "Collateral not deposited");
        require(msg.value >= loan.amount, "Insufficient funds");

        payable(loan.borrower).transfer(loan.amount);
        loan.status = LoanStatus.Funded;

        emit LoanFunded(loanId, msg.sender);
    }

    // Get total loan count
    function getLoanCount() public view returns (uint) {
        return loanCount;
    }

    // Get numeric fields of loan
    function getLoanBasic(uint loanId) public view returns (
        uint id,
        address borrower,
        address lender,
        uint amount,
        uint termDays,
        uint8 status
    ) {
        require(loanId < loanCount, "Invalid loan ID");
        Loan storage l = loans[loanId];
        return (
            l.id,
            l.borrower,
            l.lender,
            l.amount,
            l.termDays,
            uint8(l.status)
        );
    }

    // Get text fields of loan
    function getLoanText(uint loanId) public view returns (
        string memory purpose,
        string memory repaymentFrequency
    ) {
        require(loanId < loanCount, "Invalid loan ID");
        Loan storage l = loans[loanId];
        return (
            l.purpose,
            l.repaymentFrequency
        );
    }
}