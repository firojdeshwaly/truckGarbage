const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  bcrypt = require("bcrypt");
const UserSchema = new Schema(
  {
    
    role: {type: String,enum: ["User", "Driver"],default: "User",},
    name: {type: String,trim: true,default: "",},
    password: {type: String,required: true,},
    countryCode: {type: String,default: "",},
    dob: {type: String,default: "",},
    phoneNumber: {type: Number,default: "",},
    progress: {type: Number,default: 0,},
    email: {type: String,trim: true,lowercase: true,default: "",},
    image: {type: String,trim: true,default: "",},
    isSuspended: {type: Boolean,default: false,},
    isLogin: {type: Boolean,default: false,},
    referalCode: {type: String,default: "",},
    driverReferalCode: {type: String,default: "",},
    isDeleted: {type: Boolean,default: false,},
    deviceToken: {type: String,trim: true,},
    deviceType: {type: String,trim: true,},
    emailVerify: {type: Boolean,default: false,},
    loc: {type: { type: String, default: "Point" },coordinates: [{type: Number,},],},
    deviceId: [{type: String,},],
    otp: {type: String,default: "",},
    isNotification: {type: Boolean,default: true,},
    isApproved: {type: Boolean,default: false,},
    authTokenIssuedAt: {type: Number,},
    emailToken: {type: String,default: "",},
    resetToken: {type: String,default: "",},

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
UserSchema.pre("save", async function(next) {
  const user = this;
  if (!user.isModified("password")) return next();
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    next();
  } catch (e) {
    next(e);
  }
});
UserSchema.methods.comparePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (e) {
    return false;
  }
};
module.exports = mongoose.model("User", UserSchema);
