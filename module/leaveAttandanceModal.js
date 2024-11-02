const mongoose = require("mongoose");



const leaveAttandanceSchema = mongoose.Schema({
    name: String,
    email: String,
    profile: String,
    leaveApplication: String,
    userId: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
})
module.exports = mongoose.model("leavaApplcation", leaveAttandanceSchema);