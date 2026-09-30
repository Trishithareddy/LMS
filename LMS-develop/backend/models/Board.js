const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;


// Define the Board schema
const boardSchema = new Schema({
    boardId: {
        type: Number,
        unique: true,
    },
    boardName: {
        type: String,
        required: true,
        trim: true
    },
    boardDescription: {
        type: String,
        required: true,
        trim: true
    }
});

boardSchema.plugin(AutoIncrement, { inc_field: 'boardId' });

// Create the Board model
const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
