const loanDetails = {
  "0000000200": {
    term: "12 months",
    purpose: "Business Expansion",
    interest: "5%"
  },
  "0000000201": {
    term: "6 months",
    purpose: "Medical Emergency",
    interest: "4%"
  },
  "0000000202": {
    term: "3 months",
    purpose: "Education Fees",
    interest: "3.5%"
  },
  "0000000203": {
    term: "1 month",
    purpose: "Utility Bills",
    interest: "2%"
  },
  "0000000204": {
    term: "9 months",
    purpose: "New Equipment",
    interest: "4.5%"
  },
  "0000000205": {
    term: "18 months",
    purpose: "Home Renovation",
    interest: "6%"
  }
};

const modal = document.getElementById('loanModal');
const closeBtn = document.querySelector('.close-btn');
const borrowerIdEl = document.getElementById('modal-borrower-id');
const loanAmountEl = document.getElementById('modal-loan-amount');
const loanTermEl = document.getElementById('modal-loan-term');
const loanPurposeEl = document.getElementById('modal-loan-purpose');
const interestRateEl = document.getElementById('modal-interest-rate');

document.querySelectorAll('.details-btn').forEach((button, index) => {
  button.addEventListener('click', () => {
    const card = button.closest('.loan-card');
    const borrowerIdText = card.querySelector('p:nth-child(1)').textContent;
    const loanAmountText = card.querySelector('p:nth-child(2)').textContent;

    const borrowerId = borrowerIdText.split(':')[1].trim();
    const loanAmount = loanAmountText.split(':')[1].trim();

    const details = loanDetails[borrowerId];
    if (details) {
      borrowerIdEl.textContent = borrowerId;
      loanAmountEl.textContent = loanAmount;
      loanTermEl.textContent = details.term;
      loanPurposeEl.textContent = details.purpose;
      interestRateEl.textContent = details.interest;
    }

    modal.style.display = 'block';
  });
});

closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

const successModal = document.getElementById('successModal');
const confirmBtn = document.getElementById('confirmBtn');

confirmBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  successModal.style.display = 'block';
  
  setTimeout(() => {
    successModal.style.display = 'none';
    window.location.href = 'homepage.html';
  }, 3000);
});
