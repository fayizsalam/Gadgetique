import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    AddressType:{ type: String, required: true },
    BuildingName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, sparse: true },
    password: {type: String, required: function () {
        return this.authProvider === "local"}},
    authProvider: {type: String,enum: ["local", "google"],default: "local"},
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: {type: String, enum: ["active", "blocked"], default: "active"},
    otp: { type: String },
    otpExpiresAt: { type: Date },
    refreshToken: { type: String },
    googleId: { type: String },
    profilePic: { type: String },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
