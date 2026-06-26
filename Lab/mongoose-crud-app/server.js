const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

// Routes
app.use("/api/students", studentRoutes);

// MongoDB Atlas Connection
mongoose.connect("mongodb+srv://BhumikaChougule:BhumikaChougule@cluster0.3cpxp4e.mongodb.net/?appName=Cluster0")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Server start
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});