const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const DumpYardSchema = new Schema(
    {

        loc: { type: { type: String, default: "Point" }, coordinates: [{ type: Number, },], },
        Name: { type: String },
        address: { type: String },
        status: { type: Number, default: 0 },
        is_active: { type: Boolean, default: true, }

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

module.exports = mongoose.model('DumpYard', DumpYardSchema);