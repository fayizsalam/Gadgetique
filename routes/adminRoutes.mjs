import express from "express";
const router = express.Router();
import {
  getDashboard,
  getLogin,
  getSignup,
  postLogin,
  postSignup,
  logout,
} from "../controllers/adminController.mjs";
import {
  getForgotPassword,
  postForgotPassword,
  getVerifyOtp,
  postVerifyOtp,
  getResetPassword,
  postResetPassword,
  resendOtp,
} from "../controllers/adminController.mjs";
import {
  addUser,
  editUser,
  blockUser,
  unblockUser
} from "../controllers/adminController.mjs";
import {
  isAuthorized,
  isLoggedOut,
  otpVerifiedOnly,
} from "../middleware/adminProtectRoute.mjs";

//Dashboard
router.get("/dashboard", isAuthorized, getDashboard);

//Signup
router.route("/signup").get(isLoggedOut, getSignup).post(postSignup);

//Login
router.route("/login").get(isLoggedOut, getLogin).post(postLogin);

//Logout
router.route("/logout").get(logout);

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
    const refresh = req.cookies?.adminRefreshToken;

    if (!refresh) {
      console.log(`Refresh token not available in cookie`);
      return res.redirect("/admin/login");
    }

    const usertoken = await User.findOne({ refreshToken: refresh });
    if (!usertoken) return res.redirect("/admin/login");
    console.log(`Refresh token not available in DB`);

    const decoded = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET);

    if (decoded.role !== "admin") {
      return res.redirect("/admin/login");
    }

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refresh,
      role: "admin",
    });

    if (!user) return res.redirect("/admin/login");

    const newAccessToken = createAccessToken(user);

    res.cookie("adminAccessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/admin",
    });

    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.log(`Error in /refresh Route`);
    return res.redirect("/admin/login");
  }
});

//User management
router.get("/usermanagement",isAuthorized, getDashboard);

//Create User
router.post('/addUser',addUser);

//Edit User
router.post('/editUser/:id',editUser);

//Block User
router.post("/blockUser/:id/block", blockUser);

//UnBlock User
router.post("/unblockUser/:id/unblock", unblockUser);




export default router;
