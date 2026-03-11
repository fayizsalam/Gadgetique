import express from "express";
import {
  getaddProducts,
  postaddProducts,
  getupdateProducts,
  postupdateProducts,
  toggleProductStatus
} from "../controllers/productController.mjs";
import { uploadProductImage } from "../middleware/multer.mjs";
import { isAuthorized } from "../middleware/adminProtectRoute.mjs";

const router = express.Router();

//Add products
router.get("/addProducts",isAuthorized, getaddProducts);
router.post("/addProducts",isAuthorized,uploadProductImage.single("image"),postaddProducts)

//Modify products
router.get("/editProducts/:id",isAuthorized, getupdateProducts);
router.post("/editProducts/:id",isAuthorized,uploadProductImage.single("image"), postupdateProducts);

// Block & Unblock Product (toggle)
router.post("/status/:id", isAuthorized, toggleProductStatus);



export default router;
