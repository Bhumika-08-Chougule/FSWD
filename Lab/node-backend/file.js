const fs = require("fs");

// Write file
fs.writeFileSync("demo.txt", "Hello, this is Node.js file system");

// Read file
const data = fs.readFileSync("demo.txt", "utf8");

console.log(data);