import User from "../models/userModel.mjs";
import Products from "../models/productModel.mjs";
import Wishlist from "../models/wishlistModel.mjs";

import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { randomInt } from "crypto";

import { createAccessToken, createRefreshToken } from "../utils/JWT.mjs";



// Encode query messages
const encodeMsg = (msg) => encodeURIComponent(msg);

// Redirect 
const redirectWithError = (res, url, msg) =>
  res.redirect(`${url}?error=${encodeMsg(msg)}`);

const redirectWithSuccess = (res, url, msg) =>
  res.redirect(`${url}?success=${encodeMsg(msg)}`);

// Trim 
const clean = (value) => value?.trim();

// Email validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* -------------------- HOME -------------------- */

const getHome = async (req, res) => {
  try {

    const { category } = req.query;

    let query = { status: "active" };

    if (category && category !== "all") {
      query.category = category;
    }

    const products = await Products.find(query);

    // ⭐ Fetch user's wishlist
    const wishlist = await Wishlist.findOne({ userId: req.user.id });

    const wishlistIds = wishlist
  ? wishlist.products.map(p => p.productId.toString())
  : [];

    const exclusiveProducts = await Products.find({
      displaySection: "exclusive",
      status: "active",
    }).limit(5);

    const featuredProducts = await Products.find({
      displaySection: "featured",
      status: "active",
    }).limit(5);

    const normalProducts = await Products.find({
      displaySection: "normal",
      status: "active",
    });

    return res.render("user/home", {
      user: req.user.username,
      products,
      wishlistIds,
      exclusiveProducts,
      featuredProducts,
      normalProducts,
      selectedCategory: category || "all",
    });

  } catch (error) {

    console.error("getHome error:", error);
    return res.status(500).send("Internal Server Error");

  }
};

/* -------------------- SIGNUP -------------------- */

const getSignup = (req, res) => {
  return res.render("user/signup", { query: req.query });
};

const postSignup = async (req, res) => {
  try {
    const username = clean(req.body.username)?.replace(/\s+/g, "");
    const email = clean(req.body.email)?.toLowerCase();
    const password = clean(req.body.password);
    const confirmPassword = clean(req.body.confirmPassword);

    if (!username) {
      return redirectWithError(res, "/auth/signup", "Username is required.");
    }

    if (username.length > 12) {
      return redirectWithError(res,"/auth/signup","Username cannot exceed 12 characters.");
    }

    if (!email) {
      return redirectWithError(res, "/auth/signup", "Email is required.");
    }

    if (!isValidEmail(email)) {
      return redirectWithError(res, "/auth/signup", "Enter a valid email.");
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return redirectWithError(res, "/auth/signup", "Email already exists.");
    }

    if (!password || password.length < 6) {
      return redirectWithError(
        res,
        "/auth/signup",
        "Password must be at least 6 characters."
      );
    }

    if (password !== confirmPassword) {
      return redirectWithError(res, "/auth/signup", "Password mismatch.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
      role: "user",
    });

    redirectWithSuccess(res,"/auth/login","Account created successfully! Please log in.");

  } catch (error) {
    console.error("postSignup error:", error);
    return redirectWithError(res, "/auth/signup", "Something went wrong.");
  }
};

/* -------------------- LOGIN -------------------- */
const getLogin = (req, res) => {
  return res.render("user/login", { query: req.query });
};

const postLogin = async (req, res) => {
  try {
    const email = clean(req.body.email)?.toLowerCase();
    const password = clean(req.body.password);

    if (!email || !password) {
      return redirectWithError(
        res,
        "/auth/login",
        "Email and password are required."
      );
    }

    if (!isValidEmail(email)) {
      return redirectWithError(res, "/auth/login", "Enter a valid email.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return redirectWithError(res, "/auth/login", "Invalid email or password.");
    }

    if (user.isBlocked || user.status === "blocked") {
      return redirectWithError(
        res,
        "/auth/login",
        "Your account is blocked. Please contact admin."
      );
    }

    if (user.authProvider === "google") {
      return redirectWithError(
        res,
        "/auth/login",
        "This account uses Google Sign-In."
      );
    }

    if (!user.password) {
      return redirectWithError(
        res,
        "/auth/login",
        "Please sign in using Google."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return redirectWithError(res, "/auth/login", "Invalid email or password.");
    }

    // Tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Cookies
    res.cookie("userAccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/auth",
    });

    res.cookie("userRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/auth",
    });

    return res.redirect("/auth/home");
  } catch (error) {
    console.error("postLogin error:", error);
    return redirectWithError(res, "/auth/login", "Something went wrong.");
  }
};

/* -------------------- LOGOUT -------------------- */

const logout = async (req, res) => {
  try {
    res.clearCookie("userAccessToken", { path: "/auth" });
    res.clearCookie("userRefreshToken", { path: "/auth" });

    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }

    return redirectWithSuccess(res, "/auth/login", "Logged out successfully.");
  } catch (error) {
    console.error("logout error:", error);
    return redirectWithError(res, "/auth/login", "Logout failed.");
  }
};

/* -------------------- FORGOT PASSWORD -------------------- */

const getForgotPassword = (req, res) => {
  return res.render("user/forgot", { query: req.query });
};

const postForgotPassword = async (req, res) => {
  try {
    const email = clean(req.body.email)?.toLowerCase();

    if (!email) {
      return redirectWithError(res, "/auth/forgot", "Email is required.");
    }

    if (!isValidEmail(email)) {
      return redirectWithError(res, "/auth/forgot", "Enter a valid email.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return redirectWithError(
        res,
        "/auth/forgot",
        "Email not registered."
      );
    }

    // Generate OTP
    const otp = randomInt(1000, 9999).toString();

    // Hash OTP
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;

    await user.save({ validateBeforeSave: false });

    // Mail transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Gadgetique Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}

This OTP is valid for 5 minutes.

If you did not request this, please ignore this email.`,
    });

    return res.redirect(
      `/auth/verify-otp?email=${encodeURIComponent(email)}&success=${encodeMsg(
        "OTP has been sent successfully."
      )}`
    );
  } catch (error) {
    console.error("postForgotPassword error:", error);
    return redirectWithError(res, "/auth/forgot", "Something went wrong.");
  }
};

/* -------------------- VERIFY OTP -------------------- */

const getVerifyOtp = (req, res) => {
  const email = req.query.email;
  return res.render("user/verify-otp", { email, query: req.query });
};

const postVerifyOtp = async (req, res) => {
  try {
    const email = clean(req.body.email)?.toLowerCase();
    const otp = clean(req.body.otp);

    if (!email || !otp) {
      return redirectWithError(res, "/auth/forgot", "Email and OTP required.");
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp) {
      return redirectWithError(res, "/auth/forgot", "Invalid request.");
    }

    if (user.otpExpires < Date.now()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.isOtpVerified = false;
      await user.save({ validateBeforeSave: false });

      return res.redirect(
        `/auth/verify-otp?email=${encodeURIComponent(
          email
        )}&error=${encodeMsg("OTP expired. Please request again.")}`
      );
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return res.redirect(
        `/auth/verify-otp?email=${encodeURIComponent(
          email
        )}&error=${encodeMsg("Invalid OTP.")}`
      );
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isOtpVerified = true;

    await user.save({ validateBeforeSave: false });

    return res.redirect(`/auth/reset?email=${encodeURIComponent(email)}&verified=1`);
  } catch (error) {
    console.error("postVerifyOtp error:", error);
    return redirectWithError(res, "/auth/forgot", "OTP verification failed.");
  }
};

/* -------------------- RESEND OTP -------------------- */

const resendOtp = async (req, res) => {
  try {
    const email = clean(req.query.email)?.toLowerCase();

    if (!email) {
      return redirectWithError(res, "/auth/forgot", "Email is required.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return redirectWithError(res, "/auth/forgot", "User not found.");
    }

    const otp = randomInt(1000, 9999).toString();

    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;

    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Gadgetique - Resend OTP",
      text: `Your new OTP for password reset is: ${otp}

This OTP is valid for 5 minutes.`,
    });

    return res.redirect(
      `/auth/verify-otp?email=${encodeURIComponent(
        email
      )}&success=${encodeMsg("A new OTP has been sent to your email.")}`
    );
  } catch (error) {
    console.error("resendOtp error:", error);
    return redirectWithError(res, "/auth/forgot", "Failed to resend OTP.");
  }
};

/* -------------------- RESET PASSWORD -------------------- */

const getResetPassword = async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return redirectWithError(res, "/auth/forgot", "Invalid request.");
    }

    return res.render("user/reset", { email, query: req.query });
  } catch (error) {
    console.error("getResetPassword error:", error);
    return redirectWithError(res, "/auth/forgot", "Something went wrong.");
  }
};

const postResetPassword = async (req, res) => {
  try {
    const email = clean(req.body.email)?.toLowerCase();
    const password = clean(req.body.password);
    const confirmPassword = clean(req.body.confirmPassword);

    if (!email) {
      return redirectWithError(res, "/auth/forgot", "Invalid request.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return redirectWithError(res, "/auth/forgot", "User not found.");
    }

    if (!password || password.length < 6) {
      return res.redirect(
        `/auth/reset?email=${encodeURIComponent(email)}&verified=1&error=${encodeMsg(
          "Password must be at least 6 characters."
        )}`
      );
    }

    if (password !== confirmPassword) {
      return res.redirect(
        `/auth/reset?email=${encodeURIComponent(email)}&verified=1&error=${encodeMsg(
          "Passwords do not match."
        )}`
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.isOtpVerified = false;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return redirectWithSuccess(
      res,
      "/auth/login",
      "Password updated successfully! Please login."
    );
  } catch (error) {
    console.error("postResetPassword error:", error);
    return redirectWithError(res, "/auth/forgot", "Password reset failed.");
  }
};


export {
  getHome,
  getLogin,
  postLogin,
  getSignup,
  postSignup,
  logout,
  getForgotPassword,
  postForgotPassword,
  resendOtp,
  getResetPassword,
  getVerifyOtp,
  postVerifyOtp,
  postResetPassword,
};
