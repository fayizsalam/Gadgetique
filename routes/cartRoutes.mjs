import express from "express";
const router = express.Router();

import {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  getCartCount
} from "../controllers/cartController.mjs";

import { isAuthenticated } from "../middleware/userProtectRoute.mjs";

router.get("/", isAuthenticated, getCart);

router.post("/add", isAuthenticated, addToCart);

router.post("/update", isAuthenticated, updateQuantity);

router.post("/remove", isAuthenticated, removeItem);

router.get("/count", isAuthenticated, getCartCount);

export default router;