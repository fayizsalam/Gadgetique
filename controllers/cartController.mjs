import Cart from "../models/cartModel.mjs";
import Products from "../models/productModel.mjs";

/* ADD TO CART */

const addToCart = async (req, res) => {

  try {

    const userId = req.user.id;
    const { productId } = req.body;

    const product = await Products.findById(productId);

    if (!product || product.stock <= 0) {
      return res.status(400).json({ message: "Product unavailable" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {

      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 1 }]
      });

    } else {

      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex > -1) {

        cart.items[itemIndex].quantity += 1;

      } else {

        cart.items.push({
          product: productId,
          quantity: 1
        });

      }

      await cart.save();
    }

    res.json({ success: true });

  } catch (error) {

    console.log(error);
    res.status(500).json({ message: "Server error" });

  }

};



/* GET CART */

const getCart = async (req, res) => {

  try {

    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product");

    res.render("user/cart", {
      user: req.user.username,
      cart
    });

  } catch (error) {
    console.log(error);
  }

};



/* UPDATE QUANTITY */

const updateQuantity = async (req, res) => {

  try {

    const userId = req.user.id;
    const { productId, action } = req.body;

    const cart = await Cart.findOne({ user: userId });

    const item = cart.items.find(
      i => i.product.toString() === productId
    );

    if (!item) {
      return res.json({ success: false });
    }

    if (action === "increase") {
      item.quantity += 1;
    }

    if (action === "decrease") {
      item.quantity -= 1;
    }

    if (item.quantity <= 0) {

      cart.items = cart.items.filter(
        i => i.product.toString() !== productId
      );

    }

    await cart.save();

    res.json({ success: true });

  } catch (error) {
    console.log(error);
  }

};



/* REMOVE ITEM */

const removeItem = async (req, res) => {

  try {

    const userId = req.user.id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    res.json({ success: true });

  } catch (error) {
    console.log(error);
  }

};

/* GET CART COUNT */
const getCartCount = async (req, res) => {

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.json({ count: 0 });
  }

  const count = cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  res.json({ count });

};


export {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  getCartCount
};