const http = require("http");

// Create server
const server = http.createServer((req, res) => {
    res.write("Hello, Backend is Running!");
    res.end();
});

// Start server
server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});