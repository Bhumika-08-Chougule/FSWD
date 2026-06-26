import React, { useState } from "react";

function App() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validation
  const validate = () => {
    let newErrors = {};

    if (!formData.name.match(/^[A-Za-z\s]+$/)) {
      newErrors.name = "Name should contain only letters";
    }

    if (formData.age < 18) {
      newErrors.age = "Must be at least 18 years old";
    }

    if (!formData.email.match(/^[^ ]+@[^ ]+\.[a-z]{2,3}$/)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select gender";
    }

    return newErrors;
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      alert("Registration Successful!");
    }
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <h2>Voter Registration Form</h2>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <label>Name:</label><br />
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <p style={{ color: "red" }}>{errors.name}</p>

        {/* Age */}
        <label>Age:</label><br />
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
        />
        <p style={{ color: "red" }}>{errors.age}</p>

        {/* Email */}
        <label>Email:</label><br />
        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <p style={{ color: "red" }}>{errors.email}</p>

        {/* Gender */}
        <label>Gender:</label><br />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <p style={{ color: "red" }}>{errors.gender}</p>

        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default App;