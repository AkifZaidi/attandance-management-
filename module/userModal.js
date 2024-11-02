const mongoose =  require("mongoose");

mongoose.connect(`mongodb://127.0.0.1:27017/attandanceManagement`);


const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    imageUrl: String,
    userAtandance: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users"
        }
    ],
    date: {
        type:  Date,
        default: Date.now,
        required: true
    }
})

module.exports = mongoose.model("users", userSchema); 