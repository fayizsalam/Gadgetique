import Cart from '../models/cartModel.mjs';
import User from '../models/userModel.mjs';

const getCheckout = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);
    console.log(user)
    res.render("user/checkout", { user });

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

export { getCheckout };