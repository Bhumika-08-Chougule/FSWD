const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    prn: Number,
    name: String,
    cieMarks: Number
});

module.exports = mongoose.model("Student", studentSchema);