const { default: mongoose } = require("mongoose");

const subscriberSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: String,
  username: String,
  location: String,
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
});

// Create and export the User model
module.exports = mongoose.model("subscriber", subscriberSchema);
