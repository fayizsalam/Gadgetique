import express from "express";
const router = express.Router();

import {
  getProfile,
  postEditPersonalDetails,
  postEditShippingDetails,
  removeAddress,
  setDefaultAddress
} from "../controllers/profileController.mjs";

import { isAuthenticated } from "../middleware/userProtectRoute.mjs";

// Profile Page
router.get("/", isAuthenticated, getProfile);

// Update Personal Details
router.post("/editProfile-personal", isAuthenticated, postEditPersonalDetails);

// Update Shipping Details
router.post("/editProfile-shipping", isAuthenticated, postEditShippingDetails);

// Set default address
router.post("/set-default", isAuthenticated, setDefaultAddress);

// Remove address
router.post("/remove-address", isAuthenticated, removeAddress);







export default router;
