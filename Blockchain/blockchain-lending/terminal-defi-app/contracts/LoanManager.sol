// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract LoanManager {
    struct Loan {
        address lender;
        address borrower;
        uint256 amount;
        uint256 termDays;
        string purpose;
        string repaymentFrequency;
        uint256 status;  // 0: Requested, 1: Accepted, 2: Completed, 3: Defaulted
    }

    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;

    event LoanRequested(uint256 indexed loanId, address indexed lender, uint256 amount, uint256 termDays);
    event LoanAccepted(uint256 indexed loanId, address indexed borrower);

    function requestLoan(
        uint256 amount,
        uint256 termDays,
        string memory purpose,
        string memory repaymentFrequency
    ) public returns (uint256) {
        uint256 loanId = loanCount;
        loans[loanId] = Loan({
            lender: msg.sender,
            borrower: address(0),
            amount: amount,
            termDays: termDays,
            purpose: purpose,
            repaymentFrequency: repaymentFrequency,
            status: 0
        });
        loanCount++;
        emit LoanRequested(loanId, msg.sender, amount, termDays);
        return loanId;
    }

    function acceptLoan(uint256 loanId) public {
        require(loans[loanId].status == 0, "Loan not available");
        require(loans[loanId].lender != msg.sender, "Cannot accept your own loan");
        loans[loanId].borrower = msg.sender;
        loans[loanId].status = 1;
        emit LoanAccepted(loanId, msg.sender);
    }

    function getLoanCount() public view returns (uint256) {
        return loanCount;
    }

    function getLoan(uint256 loanId) public view returns (
        address lender,
        address borrower,
        uint256 amount,
        uint256 termDays,
        string memory purpose,
        string memory repaymentFrequency,
        uint256 status
    ) {
        Loan memory loan = loans[loanId];
        return (
            loan.lender,
            loan.borrower,
            loan.amount,
            loan.termDays,
            loan.purpose,
            loan.repaymentFrequency,
            loan.status
        );
    }
}