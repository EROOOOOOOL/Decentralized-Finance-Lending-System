const borrowerTab = document.getElementById('borrowerTab');
const lenderTab = document.getElementById('lenderTab');
const borrowerContent = document.getElementById('borrowerContent');
const lenderContent = document.getElementById('lenderContent');

borrowerTab.addEventListener('click', () => {
  borrowerTab.classList.add('active');
  lenderTab.classList.remove('active');
  borrowerContent.classList.remove('hidden');
  lenderContent.classList.add('hidden');
});

lenderTab.addEventListener('click', () => {
  lenderTab.classList.add('active');
  borrowerTab.classList.remove('active');
  lenderContent.classList.remove('hidden');
  borrowerContent.classList.add('hidden');
});

const createTransactionBtn = document.getElementById('createTransactionBtn');

createTransactionBtn.addEventListener('click', () => {
  if (borrowerTab.classList.contains('active')) {
    window.location.href = 'transaction-borrower.html';
  } else if (lenderTab.classList.contains('active')) {
    window.location.href = 'transaction-lender.html';
  }
});


