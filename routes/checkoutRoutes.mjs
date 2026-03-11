import express from 'express';
const router = express.Router();
import {getCheckout} from '../controllers/checkoutController.mjs';
import { isAuthenticated } from "../middleware/userProtectRoute.mjs";


// Order Page
router.get("/", isAuthenticated, getCheckout);

export default router;