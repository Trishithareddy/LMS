const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const conceptSchema = new Schema({
    conceptId:{
        type: Number,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    chapter: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
        required: false
    },
    chapterName: {
        type: String,
        required: false
    }
});

conceptSchema.plugin(AutoIncrement, { inc_field: 'conceptId' });

const Concept = mongoose.model("Concept", conceptSchema);

module.exports = Concept;
