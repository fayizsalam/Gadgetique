import express from 'express';
const router = express.Router();
import {getOrder} from '../controllers/orderController.mjs';
import { isAuthenticated } from "../middleware/userProtectRoute.mjs";


// Order Page
router.get("/", isAuthenticated, getOrder);

export default router;