import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.mjs";
import { createAccessToken, createRefreshToken } from "../utils/JWT.mjs";
import { config } from "dotenv";
config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Redirect Google login
const googleAuth = async (req, res) => {
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
  });
  res.redirect(url);
};

// Callback

const googleCallback = async (req, res) => {
  try {
  const { tokens } = await client.getToken(req.query.code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  // Find or create user
  let user = await User.findOne({ email: payload.email });

  if (!user) {
    user = await User.create({
      googleId: payload.sub,
      email: payload.email,
      username: payload.name,
      authProvider: "google",
      profilePic: payload.picture,
      role: "user",
    });
  }

  //Block User
    if (user.status === "blocked") {
     console.log("User is blocked");
      return res.redirect(
        "/auth/login?error=" + encodeURIComponent("Account is blocked! Please contact administrator")
      );
    }

  // Create JWT
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Cookies
  res.cookie("userAccessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/auth",
  });

  res.cookie("userRefreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect("/auth/home");
}catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect("/auth/login?error=Google login failed");
  }
}

export { googleAuth, googleCallback };
