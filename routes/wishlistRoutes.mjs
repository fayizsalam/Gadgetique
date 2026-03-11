import express from 'express' 
const router = express.Router();

import  {addToWishlist,getwishlist,getWishlistCount, removeFromWishlist } from "../controllers/wishlistController.mjs";

import { isAuthenticated } from "../middleware/userProtectRoute.mjs";

router.get("/",isAuthenticated, getwishlist);

router.post("/add/:productId",isAuthenticated, addToWishlist);

router.get("/count", isAuthenticated, getWishlistCount );

router.post("/remove/:productId", isAuthenticated, removeFromWishlist);

export default router;