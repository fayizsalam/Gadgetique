import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
  try {
    const accessToken = req.cookies?.userAccessToken;
    const refreshToken = req.cookies?.userRefreshToken;

    if (!accessToken) {
      if (!refreshToken) {
        return res.redirect("/auth/login?error=" + encodeURIComponent("Please login again."));
      }
      return res.redirect("/auth/refresh");
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    req.user = decoded; // store in req.user (standard practice)
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.redirect("/auth/refresh");
    }

    res.clearCookie("userAccessToken", { path: "/auth" });

    return res.redirect("/auth/login?error=" + encodeURIComponent("Session expired. Please login again."));
  }
};

const isLoggedOut = (req, res, next) => {
  const token = req.cookies?.userAccessToken;

  if (!token) return next();

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return res.redirect("/auth/home");
  } catch (err) {
    res.clearCookie("userAccessToken", { path: "/auth" });
    return next();
  }
};

const otpVerifiedOnly = (req, res, next) => {
  if (req.query.verified !== "1") {
    return res.redirect(
      "/auth/forgot?error=" +
        encodeURIComponent("Session expired. Please request OTP again.")
    );
  }

  next();
};

export { isAuthenticated, isLoggedOut, otpVerifiedOnly };
