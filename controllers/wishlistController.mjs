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

    // create wishlist if not exists
    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        products: [{ productId }]
      });
      await wishlist.save();
      return res.json({ success: true, added: true });
    } else {

    const existsIndex = wishlist.products.findIndex(item => item.productId.equals(productId))

      if (existsIndex === -1) {
        wishlist.products.push({ productId });
        await wishlist.save();
        return res.json({ success: true, added: true });
      } else {
        wishlist.products.splice(existsIndex, 1);
        await wishlist.save();
        return res.json({ success: true, added: false });
      }

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

    let wishlist = await Wishlist.findOne({ userId });

    if (wishlist) {
      const existsIndex = wishlist.products.findIndex(
        item => item.productId.toString() === productId
      );

      if (existsIndex !== -1) {
        wishlist.products.splice(existsIndex, 1);
        await wishlist.save();
      }
    }

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