const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const VehicleTypeSchema = new Schema(
    {

        name: { type: String },
        image: { type: String, trim: true, default: "", },
        type: { type: String },
        charge_time_weight: { type: Number, default: 1 },
        isSuspended: { type: Boolean, default: false, },
        isDeleted: { type: Boolean, default: false, },

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

module.exports = mongoose.model('VehicleType', VehicleTypeSchema);