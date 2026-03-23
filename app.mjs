// Imports & Setup
import express from 'express';
import { config } from 'dotenv';
config();

import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import nocache from 'nocache';


import ConnectDB from './DB/dbConnect.mjs';

// Routes
import adminRoutes from './routes/adminRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import orderRoutes from './routes/orderRoutes.mjs';
import profileRoutes from './routes/profileRoutes.mjs';
import productRoutes from './routes/productRoutes.mjs';
import checkoutRoutes from './routes/checkoutRoutes.mjs';
import wishlistRoutes from './routes/wishlistRoutes.mjs';
import cartRoutes from './routes/cartRoutes.mjs';

// Middleware imports
import { errorMiddleware } from './middleware/error.mjs';

 
const app = express();
const PORT = process.env.PORT || 5201;

// Database Connection
ConnectDB();

// Directory Setup (for EJS & static files)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static("src/public/uploads"));


// Core Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(nocache());


//Routes
app.use('/admin',adminRoutes);
app.use('/auth',userRoutes);
app.use('/admin/products',productRoutes);
app.use('/auth/orders',orderRoutes);
app.use('/auth/profile',profileRoutes);
app.use('/auth/cart',cartRoutes);
app.use('/auth/wishlist',wishlistRoutes);
app.use('/auth/checkout',checkoutRoutes);



//Error Handling Middleware
app.use(errorMiddleware);


//Start Server
app.listen(PORT,()=>console.log(`Server running \n    For User=> http://localhost:${PORT}/auth/login
    For admin=> http://localhost:${PORT}/admin/login`));