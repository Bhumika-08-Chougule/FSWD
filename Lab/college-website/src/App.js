import { useState } from "react";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={{ fontFamily: "Arial" }}>
      
      <h1 style={{ background: "blue", color: "white", padding: "10px" }}>
        DKTE College Website
      </h1>

      {/* Navigation */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("about")}>About Us</button>
        <button onClick={() => setPage("courses")}>Courses</button>
        <button onClick={() => setPage("login")}>Login</button>
      </div>

      <hr />

      {/* HOME */}
      {page === "home" && (
        <div>
          <h2>Welcome to DKTE Institute</h2>
          <p>Empowering students with quality technical education.</p>
        </div>
      )}

      {/* ABOUT */}
      {page === "about" && (
        <div>
          <h2>About Us</h2>
          <p>
            DKTE’s Textile & Engineering Institute is located in the heart of Ichalkaranji city, known as the Manchester of Maharashtra. 
            The institute was established in 1981 under the guidance of visionary leader Mr. K.B. Awade (Ex. M.P).
          </p>
          <p>
            It was founded to support the growth of the textile industry and to develop skilled technical professionals. Over four decades,
            the institute has contributed significantly to the technological, industrial, and economic development of the region and country.
          </p>
          <p>
            The institute is now autonomous and offers multiple undergraduate, postgraduate, management, and vocational programs.
            It also has research centres for Ph.D. programs in various engineering disciplines. It is accredited with A+ grade by NAAC.
          </p>
          <p>
            More than 12,500 alumni are working worldwide, making the institute proud with their achievements.
          </p>
        </div>
      )}

      {/* COURSES */}
      {page === "courses" && (
        <div>
          <h2>Courses Offered</h2>
          <ul>
            <li>B.Tech Computer Science Engineering (CSE)</li>
            <li>B.Tech Electronics & Telecommunication (ENTC)</li>
            <li>B.Tech Artificial Intelligence & Machine Learning (AIML)</li>
            <li>B.Tech Applied Data Science (ALDS)</li>
            <li>M.Tech Programs</li>
            <li>Management Studies (MBA)</li>
          </ul>
        </div>
      )}

      {/* LOGIN */}
      {page === "login" && (
        <div>
          <h2>Login</h2>
          <form>
            <div>
              <input type="text" placeholder="Username" />
            </div>
            <div>
              <input type="password" placeholder="Password" />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      )}

    </div>
  );
}

export default App;
