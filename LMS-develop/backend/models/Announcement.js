const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const announcementSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160
    },
    announcementType: {
        type: String,
        enum: ['general', 'reminder', 'activity', 'assessment', 'urgent', 'event'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['normal', 'important', 'urgent'],
        default: 'normal'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isReminder: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    linkUrl: {
        type: String,
        trim: true,
        default: ""
    },
    linkLabel: {
        type: String,
        trim: true,
        default: ""
    },
    batches: [{
        type: Schema.Types.ObjectId,
        ref: 'Batch'
    }],
    announcementContent: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    readBy: [{
        student: {
            type: Schema.Types.ObjectId,
            ref: 'Student'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]

}, {
    timestamps: true,
});


const Announcement = mongoose.model('Announcement', announcementSchema);


module.exports = Announcement;
