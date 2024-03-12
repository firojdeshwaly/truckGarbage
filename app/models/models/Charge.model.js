const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const ChargeSchema = new Schema(
    {

        driverId: { type: Schema.Types.ObjectId, ref: "User", },
        userId: { type: Schema.Types.ObjectId, ref: "User", },
        pickUpLoc: { type: { type: String, default: "Point" }, coordinates: [{ type: Number, },], },
        dropLoc: { type: { type: String, default: "Point" }, coordinates: [{ type: Number, },], },
        weight: { type: { type: Number, default: 0 } },
        distance: { type: { type: Number, } },
        time: { type: { type: Number, default: 0 } },
        act_amount: { type: { type: Number, default: 0 } },
        chargedAmount: { type: Number },
        transaction_id: { type: String },
        type: { type: Number, default: 0 },
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

module.exports = mongoose.model('Charge', ChargeSchema);