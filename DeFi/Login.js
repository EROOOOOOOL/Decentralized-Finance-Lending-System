document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault(); 

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("http://localhost/DeFi/Login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Login successful!");
        } else {
            alert("Login failed: " + data.message);
        }
    });
});