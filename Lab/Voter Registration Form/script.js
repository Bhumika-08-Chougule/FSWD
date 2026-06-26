function validateForm(){

    let name = document.getElementById("name").value;
    let age = document.getElementById("age").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;

    isValid = true ;

    document.getElementById("nameError").innerText = "";
    document.getElementById("ageError").innerText = "";
    document.getElementById("emailError").innerText = "";
    document.getElementById("phoneError").innerText = "";

        let namePattern = /^[A-Za-z\s]+$/;
        if (name === "" || !namePattern.test(name)) {
            document.getElementById("nameError").innerText = "Enter valid name";
            isValid = false;
        }

        if (age === "" || age < 18) {
        document.getElementById("ageError").innerText = "Age must be 18 or above";
        isValid = false;
        }

        let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
        if (!emailPattern.test(email)) {
            document.getElementById("emailError").innerText = "Enter valid email";
            isValid = false;
        }

        let phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(phone)) {
            document.getElementById("phoneError").innerText = "Enter 10 digit phone number";
            isValid = false;
        }

        if (isValid) {
        alert("Registration Successful!");
         }
        return false; // stop page reload

}