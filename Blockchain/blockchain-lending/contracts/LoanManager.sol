// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract LoanManager {
    uint public collateralAmount = 1000; // PHP equivalent
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
    mapping(uint => bool) public collateralDeposited;

    event LoanRequested(uint loanId, address borrower);
    event LoanAccepted(uint loanId, address lender);
    event CollateralDeposited(uint loanId, address borrower);
    event LoanFunded(uint loanId, address lender);
    event LoanCompleted(uint loanId);

    function requestLoan(uint amount, uint termDays, string memory purpose, string memory repaymentFrequency) public {
        loans.push(Loan({
            id: loanCount,
            borrower: msg.sender,
            lender: address(0),
            amount: amount,
            termDays: termDays,
            purpose: purpose,
            repaymentFrequency: repaymentFrequency,
            status: LoanStatus.Requested
        }));
        emit LoanRequested(loanCount, msg.sender);
        loanCount++;
    }

    function acceptLoan(uint loanId) public {
        require(loans[loanId].status == LoanStatus.Requested, "Loan not available");
        loans[loanId].lender = msg.sender;
        loans[loanId].status = LoanStatus.Accepted;
        emit LoanAccepted(loanId, msg.sender);
    }

    function depositCollateral(uint loanId) public payable {
        require(msg.sender == loans[loanId].borrower, "Only borrower");
        require(msg.value >= collateralAmount, "Insufficient collateral");
        loans[loanId].status = LoanStatus.CollateralDeposited;
        emit CollateralDeposited(loanId, msg.sender);
    }

    function fundLoan(uint loanId) public payable {
        require(msg.sender == loans[loanId].lender, "Only lender");
        require(loans[loanId].status == LoanStatus.CollateralDeposited, "Collateral not yet deposited");
        require(msg.value >= loans[loanId].amount, "Insufficient funds");
        payable(loans[loanId].borrower).transfer(loans[loanId].amount);
        loans[loanId].status = LoanStatus.Funded;
        emit LoanFunded(loanId, msg.sender);
    }

    function getLoanCount() public view returns (uint) {
        return loanCount;
    }

    function getLoan(uint loanId) public view returns (
        uint, address, address, uint, uint, string memory, string memory, LoanStatus
    ) {
        Loan memory l = loans[loanId];
        return (l.id, l.borrower, l.lender, l.amount, l.termDays, l.purpose, l.repaymentFrequency, l.status);
    }
}
