document.getElementById("submitBtn").addEventListener("click", function () {
    const loanAmount = document.getElementById("loanAmount").value.trim();
    const loanTerm = document.getElementById("loanTerm").value.trim();
    const loanPurpose = document.getElementById("loanPurpose").value.trim();
    const checkboxes = document.querySelectorAll(".acknowledgment input[type='checkbox']");
  
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
  
    if (!loanAmount || !loanTerm || !loanPurpose || !allChecked) {
      alert("Please fill out all fields and agree to all terms before submitting.");
      return;
    }

    document.getElementById("summaryAmount").textContent = parseFloat(loanAmount).toFixed(2);
    document.getElementById("summaryTerm").textContent = `${loanTerm} Months`;
    document.getElementById("summaryPurpose").textContent = loanPurpose;
  
    document.getElementById("summaryModal").style.display = "flex";
  });

  document.getElementById("confirmSubmit").addEventListener("click", () => {

    const modalContent = document.querySelector(".modal-content");
    const summaryRows = modalContent.querySelectorAll(".summary-row, .confirm-container, h2");
    summaryRows.forEach(el => el.style.display = "none");
  
    document.getElementById("successMessage").style.display = "block";
  
    setTimeout(() => {
      document.getElementById("summaryModal").style.display = "none";
      window.location.href = "Homepage.html"; 
    }, 3000);
  });
  
  document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
  });
  