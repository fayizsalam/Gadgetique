import express from "express";
const router = express.Router();

import jwt from "jsonwebtoken";
import User from "../models/userModel.mjs";
import { createAccessToken } from "../utils/JWT.mjs";

import {
  getHome,
  getLogin,
  postLogin,
  getSignup,
  postSignup,
  logout,
} from "../controllers/userController.mjs";
import {
  isAuthenticated,
  isLoggedOut,
  otpVerifiedOnly,
} from "../middleware/userProtectRoute.mjs";
import {
  getForgotPassword,
  postForgotPassword,
  getVerifyOtp,
  postVerifyOtp,
  postResetPassword,
  getResetPassword,
  resendOtp,
} from "../controllers/userController.mjs";
import { googleAuth, googleCallback } from "../utils/googleLogin.mjs";

//
router.get("/home", isAuthenticated, getHome);

//Signup
router.route("/signup").get(isLoggedOut, getSignup).post(postSignup);

//Login
router.route("/login").get(isLoggedOut, getLogin).post(postLogin);

//Logout
router.get("/logout",isAuthenticated, logout);

// Forgot Password
router.get("/forgot", getForgotPassword);
router.post("/forgot", postForgotPassword);

// Resend OTP
router.get("/resend-otp", resendOtp);

//Verify-OTP
router.get("/verify-otp", getVerifyOtp);
router.post("/verify-otp", postVerifyOtp);

// Reset Password
router.get("/reset", otpVerifiedOnly, getResetPassword);
router.post("/reset", postResetPassword);

//Refresh token
router.get("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.userRefreshToken;
    if (!refreshToken) {
      console.log(`User Refresh token not available in cookie`);
      return res.redirect("auth/login");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (decoded.role !== "user") {
      return res.redirect("/auth/login");
    }

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
      role: "user",
    });

    if (!user) return res.redirect("/auth/login?error=" + encodeURIComponent("Session expired!."));

    const newAccessToken = createAccessToken(user);

    res.cookie("userAccessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/auth",
    });

    return res.redirect("/auth/home");

  } catch (err) {
    console.log(`Error in /user refresh Route`);
    return res.redirect("/auth/login?error=" + encodeURIComponent("Session expired. Please login again."));
  }
});

// Sign In with Google
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
