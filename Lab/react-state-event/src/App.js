import React, { useState } from "react";

function App() {
  // Step 1: Create State
  const [message, setMessage] = useState("Hello");

  // Step 2: Create Event Function
  function changeMessage() {
    setMessage("Welcome 🎉");
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {/* Step 3: Display State */}
      <h1>{message}</h1>

      {/* Step 4: Handle Event */}
      <button onClick={changeMessage}>Click Me</button>
    </div>
  );
}

export default App;