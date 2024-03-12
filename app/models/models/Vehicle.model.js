const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  bcrypt = require("bcrypt");
const VehicleSchema = new Schema(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    vehicleTypeId: {
      type: Schema.Types.ObjectId,
      ref: "VehicleType",
    },
    vehicleName: {
      type: String,
      trim: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      default: "",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created",
      updatedAt: "updated",
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
module.exports = mongoose.model("Vehicle", VehicleSchema);
