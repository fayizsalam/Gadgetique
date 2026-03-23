import User from "../models/userModel.mjs";
import bcrypt from "bcrypt";
import { createAccessToken, createRefreshToken } from "../utils/JWT.mjs";
import nodemailer from "nodemailer";
import { randomInt } from "crypto";
import Products from "../models/productModel.mjs";

//Dashboard
const getDashboard = async (req, res) => {
   try {
     const users = await User.find().lean(); // lean() is important for templates
     const products = await Products.find().lean();
    

    res.render("admin/dashboard", {users,products,query: req.query});
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

//Signup
const getSignup = async (req, res) => {
  try {
    console.log(`getSignup Controller`);
    res.render("admin/signup", { query: req.query });
  } catch (error) {
    console.error(error);
  }
};

const postSignup = async (req, res) => {
  console.log(`Entered to postSignup Controller`);
  const { username, email, password, confirmPassword } = req.body;
  console.log(username, email, password, confirmPassword);
  try {
    // Validation for username , email and password
    const trimmedUsername = username?.trim().replace(/\s+/g, "");
    const trimmedEmail = email?.trim().replace(/\s+/g, "");
    const trimmedPassword = password?.trim().replace(/\s+/g, "");
    const trimmedConfirmPassword = confirmPassword?.trim().replace(/\s+/g, "");

    //Check empty or space
    if (!trimmedUsername || trimmedUsername.length === 0) {
      console.log("Username cannot be empty or spaces only.");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Username cannot be empty or spaces only.")
      );
    }

    //Username min char
    if (trimmedUsername.length > 12) {
      console.log("Username cannot be more than 12 characters");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Username cannot be more than 12 characters")
      );
    }

    if (!trimmedEmail || trimmedEmail.length === 0) {
      console.log("Email cannot be empty or just spaces.");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Email cannot be empty or just spaces.")
      );
    }

    if (!trimmedPassword || trimmedPassword.length === 0) {
      console.log("Password cannot be empty or just spaces.");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Password cannot be empty or just spaces.")
      );
    }

    if (!trimmedConfirmPassword || trimmedConfirmPassword.length === 0) {
      console.log("Confirm password cannot be empty or just spaces.");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Confirm password cannot be empty or just spaces.")
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log("Email format validation error");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Enter a valid email address.")
      );
    }

    //Password min char
    if (trimmedPassword.length < 6 || trimmedConfirmPassword.length < 6) {
      console.log("Password must be at least 6 characters");
      return res.redirect(
        "/admin/signup?error=" +
          encodeURIComponent("Password must be at least 6 characters")
      );
    }

    //Password Check
    if (trimmedPassword !== trimmedConfirmPassword) {
      console.log("Password mismatch");
      return res.redirect(
        "/admin/signup?error=" + encodeURIComponent("Password mismatch")
      );
    }

    //User exist
    const userExist = await User.findOne({ email: trimmedEmail });
    if (userExist) {
      console.log(`Email already regestered`);
      return res.redirect(
        "/admin/signup?error=" + encodeURIComponent("Email Already Regestered")
      );
    }

    //Hash pwd
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    //Create new admin
    const newAdmin = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("New Admin registered:", newAdmin.email);

    res.redirect(
      "/admin/login?success=" +
        encodeURIComponent("Account created successfully! Please log in.")
    );
  } catch (err) {
    console.log(`Error in postSignup Controller`, err);
  }
};

//Login
const getLogin = async (req, res) => {
  res.render("admin/login", { query: req.query });
};

const postLogin = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Email format validation error");
      return res.redirect(
        "/admin/login?error=" +
          encodeURIComponent("Enter a valid email address.")
      );
    }

    // USER CHECK in DB
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found!");
      return res.redirect(
        "/admin/login?error=" + encodeURIComponent("Invalid email or password.")
      );
    }

    // ROLE CHECK in DB
    if (user.role !== "admin") {
      return res.redirect(
        `/admin/login?error=${encodeURIComponent("Unauthorized access.")}`
      );
    }

    // PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password not match");
      return res.redirect(
        "/admin/login?error=" + encodeURIComponent("Invalid email or password.")
      );
    }

    // Create tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set cookies
    res.cookie("adminAccessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/admin",
    });

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/admin"
    });

    res.redirect("/admin/dashboard");

  } catch (error) {
    console.log(`Error in postSignup Controller`, err);
    return res.redirect(
      "/admin/login?error=" +
        encodeURIComponent("Something went wrong. Please try again.")
    );
  }
};

//Logout
const logout = async (req, res) => {
  console.log("Admin logout");

  res.clearCookie("adminAccessToken", {
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
  });

  res.clearCookie("adminRefreshToken", {
    path: "/admin",
    httpOnly: true,
    sameSite: "lax",
  });
  res.redirect(
    "/admin/login?error=" + encodeURIComponent("You are Logged out")
  );
};

//Forgot Password

const getForgotPassword = (req, res) => {
  res.render("admin/forgot", { query: req.query });
};

const postForgotPassword = async (req, res, next) => {
  const { email } = req.body;
  console.log(email);

  try {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      console.log(`User not found in DB`);
      return res.redirect(
        "/admin/forgot?error=" +
          encodeURIComponent("Please enter regesterd email address")
      );
    }

    // Generate OTP
    const otp = randomInt(1000, 9999).toString();

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Set OTP fields
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Mail options
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Gadgetique Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}\n\nThis code is valid for 5 minutes.\n\n
            If you didn’t request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    console.log(`OTP send to the ${user.email}`)

    res.render("admin/verify-otp", {
      email: trimmedEmail,
      query: { success: "OTP has been sent successfully" },
    });
  } catch (err) {
    console.error("postForgotPassword error:", err);
    return res.redirect(
      "/admin/forgot?error=" +
        encodeURIComponent("Something went wrong. Please try again.")
    );
  }
};

// verify-otp
const getVerifyOtp = (req, res) => {
  const email = req.query.email;
  res.render("admin/verify-otp", { email, query: req.query });
};

const postVerifyOtp = async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const otp = req.body.otp?.trim();

  console.log(`Email:${email} and OTP:${otp}`)

  if (!email || !otp) {
    console.log(`Email or OTP missing.`);
    return res.redirect(
      "/admin/forgot?error=" + encodeURIComponent("Email or OTP is missing")
    );
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !user.otp) {
      return res.redirect(
        "/admin/forgot?error=" + encodeURIComponent("Invalid Request")
      );
    }

    // Check if OTP expired
    if (user.otpExpires < Date.now()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.isOtpVerified = false;

      await user.save({ validateBeforeSave: false });

      return res.redirect(
        `/admin/verify-otp?email=${encodeURIComponent(
          email
        )}&error=${encodeURIComponent("OTP expired. Please request again.")}`
      );
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return res.redirect(
        `/admin/verify-otp?email=${encodeURIComponent(
          email
        )}&error=${encodeURIComponent("Invalid OTP")}`
      );
    }

    // Update password and clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isOtpVerified = true;

    await user.save({ validateBeforeSave: false });


    res.redirect(`/admin/reset?email=${encodeURIComponent(email)}&verified=1`);

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.redirect(
      `/admin/verify-otp?email=${encodeURIComponent(
        email
      )}&error=${encodeURIComponent("Error verifying OTP")}`
    );
  }
};

// Resend OTP
const resendOtp = async (req, res) => {
  const email = req.query.email;

  if (!email) {
    console.log(`Email missing.`);
    return res.redirect(
      "/admin/forgot?error=" + encodeURIComponent("Email is missing")
    );
  }

  try {
    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      console.log(`User not found.`);
      return res.redirect(
        "/admin/forgot?error=" +
          encodeURIComponent(
            "User not found!, Please enter regestered email address"
          )
      );
    }

    // Generate new OTP
    const otp = randomInt(1000, 9999).toString();

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Update user OTP fields
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save({ validateBeforeSave: false });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Gadgetique - Resend OTP",
      text: `Your new OTP for password reset is: ${otp}\n\nThis code is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.redirect(
      `/admin/verify-otp?email=${encodeURIComponent(
        user.email
      )}&success=${encodeURIComponent(
        "A new OTP has been sent to your email."
      )}`
    );
  } catch (err) {
    console.error(err);
    res.redirect(
      `/admin/verify-otp?email=${encodeURIComponent(
        email
      )}&error=${encodeURIComponent("Error sending OTP")}`
    );
  }
};

//Reset Password

const getResetPassword = async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      console.log("Email not available");
      return res.redirect(
        "/admin/forgot?error=" +
          encodeURIComponent("Invalid request. Please try again.")
      );
    }

    console.log(`Email available`);

    res.render("admin/reset", { email, query: req.query });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.redirect(
      `/admin/forgot?error=${encodeURIComponent("Something went wrong!")}`
    );
  }
};

const postResetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  console.log(email, password, confirmPassword);

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`email does not exist in postResetPassword`);
      return res.redirect(
        `/admin/forgot?error=${encodeURIComponent(
          email
        )}&verified=1&error=${encodeURIComponent("Invalid Request")}`
      );
    }

    // Validation for username , email and password
    const trimmedPassword = password?.trim();
    const trimmedConfirmPassword = confirmPassword?.trim();

    if (!trimmedPassword || trimmedPassword.length === 0) {
      console.log("Empty or spaces in updating new password.");
      return res.redirect(
        `/admin/reset?email=${encodeURIComponent(email)}&verified=1&error=${encodeURIComponent("New password cannot be empty or just spaces.")}`
      );
    }

    //Password min char
    if (trimmedPassword.length < 6 || trimmedConfirmPassword.length < 6) {
      return res.redirect(`/admin/reset?email=${encodeURIComponent(email)}&verified=1&error=${encodeURIComponent("Password must be at least 6 characters.")}`
      );
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      return res.redirect(`/admin/reset?email=${encodeURIComponent(email)}&verified=1&error=${encodeURIComponent("Passwords do not match.")}`
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    user.password = hashedPassword;
    user.isOtpVerified = false;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(`New Password updated in DB`);

    res.redirect(
      "/admin/login?success=" +
        encodeURIComponent("Password updated successfully! Please log in.")
    );
  } catch (err) {
    console.error(err, "Post Reset Password Error.");
    return res.redirect(
      "/admin/forgot?error=" + encodeURIComponent("Error resetting password.")
    );
  }
};

//Create new User
const addUser = async (req,res) => {
  try {
    const {username,email,password,role}=req.body;
    // Validation for username , email and password
    const trimmedUsername = username?.trim().replace(/\s+/g, "");
    const trimmedEmail = email?.trim().replace(/\s+/g, "");
    const trimmedPassword = password?.trim().replace(/\s+/g, "");
    console.log(trimmedUsername,trimmedEmail,trimmedPassword,role);

    //Check empty or space
    if (!trimmedUsername || trimmedUsername.length === 0) {
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Username cannot be empty or spaces only.")
      );
    }

    //Username min char
    if (trimmedUsername.length > 12) {
      console.log("Username cannot be more than 12 characters");
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Username cannot be more than 12 characters")
      );
    }

    if (!trimmedEmail || trimmedEmail.length === 0) {
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Email cannot be empty or just spaces.")
      );
    }

    if (!trimmedPassword || trimmedPassword.length === 0) {
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Password cannot be empty or just spaces.")
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log("Email format validation error");
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Enter a valid email address.")
      );
    }

    // Check if user already exists
        const existUser = await User.findOne({ email: trimmedEmail });
        if (existUser) {
          return res.redirect(
            "/admin/dashboard/usermanagement?error=" + encodeURIComponent("Email already exist.")
          );
        }

    //Password min char
    if (trimmedPassword.length < 6) {
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Password must be at least 6 characters")
      );
    }

    // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      role:role
    });

    console.log("New User registered:", newUser.email);

    // Alert success message
    res.redirect(
      "/admin/dashboard?view=users&success=" +
        encodeURIComponent("Account created successfully.")
    );

    
  } catch (error) {
    console.log(`Error in create new user controller`,error);
    return res.redirect(
        "/admin/dashboard?error=" +
          encodeURIComponent("Error loading in user Management")
      );
  }
}

//Edit User
const editUser = async (req,res) => {
  try {
    console.log(`Hit the edit user`);
     const {username,role}=req.body;
     const { id } = req.params;
    // Validation for username
    const trimmedUsername = username?.trim().replace(/\s+/g, "");
    console.log(trimmedUsername,role);

    //Check empty or space
    if (!trimmedUsername || trimmedUsername.length === 0) {
      return res.redirect(
        "/admin/dashboard/usermanagement?error=" +
          encodeURIComponent("Username cannot be empty or spaces only.")
      );
    }

    // Edit user
    await User.findByIdAndUpdate(id,{
      username: trimmedUsername,
      role:role
    });

    console.log(`updated successfully`);

    // Alert success message
    res.redirect(
      "/admin/dashboard?view=users&success=" +
        encodeURIComponent("Account updated successfully.")
    );
    
  } catch (error) {
    console.log(`Error in edit user controller`,error);
    return res.redirect(
        "/admin/dashboard?view=users&error=" +
          encodeURIComponent("Error loading in user Management")
      );
  }
  
}

//Block User
const blockUser = async (req,res) => {
  try {
    const {id}= req.params;
    await User.findByIdAndUpdate(id, {
    status: "blocked"
    });

    // Alert success message
    res.redirect("/admin/dashboard?view=users&success=" + encodeURIComponent("Account blocked successfully."));
    
  } catch (error) {
    console.log(`Error in edit user controller`,error);
    return res.redirect("/admin/dashboard?view=users&error=" + encodeURIComponent("Error loading in user Management"));
  }
  
}

// Unblock
const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: "active" });
  // Alert success message
    res.redirect("/admin/dashboard?view=users&success=" + encodeURIComponent("Account blocked successfully."));
    
  } catch (error) {
    console.log(`Error in edit user controller`,error);
    return res.redirect("/admin/dashboard?view=users&error=" + encodeURIComponent("Error loading in user Management"));
  }
  
};
export { getDashboard, 
         getSignup,
         postSignup,
         getLogin,
         postLogin,
         logout,
         getForgotPassword,
         postForgotPassword,
         getVerifyOtp,
         postVerifyOtp,
         getResetPassword,
         postResetPassword,
         resendOtp,
         addUser,
         editUser,
         blockUser,
         unblockUser
        };
