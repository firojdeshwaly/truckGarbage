const mongoose = require("mongoose"),
  Schema = mongoose.Schema;
const AddressSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    address: {
      type: String,
      trim: true,
    },
    loc: {
      type: { type: String, default: "Point" },
      coordinates: [
        {
          type: Number,
        },
      ],
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
module.exports = mongoose.model("Address", AddressSchema);
