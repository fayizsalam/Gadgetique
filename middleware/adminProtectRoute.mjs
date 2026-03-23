import jwt from "jsonwebtoken";

const isAuthorized = (req, res, next) => {
  try {
    const accessToken = req.cookies?.adminAccessToken;
    const refreshToken = req.cookies?.adminRefreshToken;

    if (!accessToken) {
      if (!refreshToken) {
        return res.redirect("/admin/login?error=Please log in again.");
      }
      return res.redirect("/admin/refresh");
    }

    console.log(`Token Generated`);
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
    if (decoded.role !== "admin") {
      return res.redirect("/admin/login?error=Unauthorized");
    }
    req.user = decoded;
    next();
  } catch (err) {
    // If access token expired
    if (err.name === "TokenExpiredError") {
      console.log("Access token expired → redirecting to refresh");
      return res.redirect("/admin/refresh");
    }
    console.log("Invalid access token → forcing login");
    return res.redirect(
      "/admin/login?error=" +
        encodeURIComponent("Session expired. Please log in again.")
    );
  }
};

const isLoggedOut = (req, res, next) => {
  const token = req.cookies?.adminAccessToken;

  if (!token) {
    console.log("No token → allow login page");
    return next();
  }

  try {
    // Verify token validity
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Token available → redirecting to Dashboard");
    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.log("Invalid token → clearing cookie");
    res.clearCookie("adminAccessToken", { path: "/admin" });
    return next();
  }
};

function otpVerifiedOnly(req, res, next) {
  if (req.query.verified !== "1") {
    console.log("NOT MATCHED and cannot be verified :", req.query.verified);
    return res.redirect(
      "/admin/forgot?error=" +
        encodeURIComponent("Session expired. Please request OTP again.")
    );
  }
  console.log(`${req.query.verified} is matched`);
  next();
}

export { isAuthorized, isLoggedOut, otpVerifiedOnly };
