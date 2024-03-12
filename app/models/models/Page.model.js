const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const PagesSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            trim: true,
        },
        page_name: {
            type: String,
            trim: true,
        },
        slug: {
            type: String,
        },
        isSuspended: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated',
        },
        id: false,
        toJSON: {
            getters: true,
        },
        toObject: {
            getters: true,
        },
    }
);
module.exports = mongoose.model('Pages', PagesSchema);