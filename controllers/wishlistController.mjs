import  Wishlist from '../models/wishlistModel.mjs';


/* GET CART */

const getwishlist = async (req, res) => {
  try {

    const userId = req.user.id;

    const wishlist = await Wishlist
      .findOne({ userId })
      .populate("products.productId");

    res.render("user/wishlist", {
      user: req.user.username,
      wishlist
    });

  } catch (error) {
    console.log(error);
  }
};

const addToWishlist = async (req, res) => {

  try {

    const userId = req.user.id;
    const productId = req.params.productId;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {

      wishlist = await Wishlist.create({
        userId,
        products: [{ productId }]
      });

      return res.json({ success: true, added: true });

    }

    const exists = wishlist.products.some(
      item => item.productId.toString() === productId
    );

    if (exists) {

      await Wishlist.updateOne(
        { userId },
        { $pull: { products: { productId } } }
      );

      return res.json({ success: true, added: false });

    } else {

      await Wishlist.updateOne(
        { userId },
        { $push: { products: { productId } } }
      );

      return res.json({ success: true, added: true });

    }

  } catch (error) {

    console.log(error);
    res.json({ success: false });

  }

};

const removeFromWishlist = async (req, res) => {
  try {

    const userId = req.user.id;
    const productId = req.params.productId;

    await Wishlist.updateOne(
      { userId },
      { $pull: { products: { productId } } }
    );

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
};

const getWishlistCount = async (req, res) => {

  const wishlist = await Wishlist.findOne({ userId: req.user.id });

  const count = wishlist ? wishlist.products.length : 0;

  res.json({ count });

};

export  { addToWishlist,
        getwishlist,
        getWishlistCount,
        removeFromWishlist
    };