const mongoose = require("mongoose");



const attandanceSchema = mongoose.Schema({
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
    },
    status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' },
})
attandanceSchema.index({ userId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("attandance", attandanceSchema);