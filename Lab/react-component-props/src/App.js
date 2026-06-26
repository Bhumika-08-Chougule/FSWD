import React from "react";
import Student from "./Student";

function App() {
  return (
    <div>
      <h1>Student Details</h1>

      <Student name="Bhumika" age={21} course="B.Tech" />
      <Student name="Rahul" age={22} course="MCA" />
      <Student name="Sneha" age={20} course="BSc IT" />

    </div>
  );
}

export default App;

/*
import React from "react";

function App() {
  return (
    <div>
      <h1>My React App</h1>
    </div>
  );
}

export default App;*/