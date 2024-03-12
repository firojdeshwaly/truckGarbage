const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UserRequestSchema = new Schema(
    {

        driverId: { type: Schema.Types.ObjectId, ref: "User", },
        requestId: { type: Schema.Types.ObjectId, ref: "Request", },
        vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", },
        yardId: { type: Schema.Types.ObjectId, ref: "DumpYard", },
        pickUpLoc: { type: { type: String, default: "Point" }, coordinates: [{ type: Number, },], },
        dropLoc: { type: { type: String, default: "Point" }, coordinates: [{ type: Number, },], },
        chargedAmount: { type: Number },
        transaction_id: { type: String },
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

module.exports = mongoose.model('UserRequest', UserRequestSchema);