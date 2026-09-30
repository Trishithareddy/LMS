const mongoose = require('mongoose');

// Previous schemas remain the same
const SubSelectedBlockSchema = new mongoose.Schema({
    subBlockName: {
        type: String,
        required: true
    },
    value: {
        type: Boolean,
        required: true
    }
}, { _id: false });

const SelectBlockSchema = new mongoose.Schema({
    blockCategory: {
        type: String,
        required: true,
        enum: ['motion', 'looks', 'sound', 'event', 'control', 'sensing', 'operators', 'variables', 'myblocks']
    },
    subSelectedBlock: {
        type: [SubSelectedBlockSchema],
        default: []
    }
}, { _id: false });

// Update the main schema to store files as Buffer
const ScratchSchema = new mongoose.Schema({
    ScratchTitle: {
        type: String,
        required: true
    },
    ScratchDescription: {
        type: String,
        required: true
    },
    ScratchInstruction: {
        type: String,
        required: true
    },
    ScratchFile: {
        type: String,
        required: true
    },
    ScratchImage: {
        type: String,
        required: false
    },
    SelectBlock: {
        type: [SelectBlockSchema],
        default: []
    },
    ScratchFilePublicId: { type: String },
    ScratchImagePublicId: { type: String },

}, {
    timestamps: true
});

const Scratch = mongoose.model('Scratch', ScratchSchema);

module.exports = Scratch;