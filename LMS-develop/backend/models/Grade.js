const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;


// Define the Grade schema
const gradeSchema = new Schema({
    gradeId: {
        type: Number,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
});

gradeSchema.plugin(AutoIncrement, { inc_field: 'gradeId' });

// Create the Grade model
const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
