const mongoose = require('mongoose');

const timeSettingsSchema = new mongoose.Schema({
    timeInterval: {
        type: Number,
        required: true,
        min: 5,  // Minimum 5 seconds
        default: 5
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const TimeSettings = mongoose.model('TimeSettings', timeSettingsSchema);

module.exports = TimeSettings;