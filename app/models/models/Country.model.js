const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const CountrySchema = new Schema(
    {
        name: {
            type: String,
        },
        dial_code: {
            type: String,
        },
        code: {
            type: String,
        },
        is_active: {
            type: Boolean,
            default: true,
        }
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

module.exports = mongoose.model('Country', CountrySchema);