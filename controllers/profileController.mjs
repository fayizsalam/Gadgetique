import User from "../models/userModel.mjs";

// ==============================
// GET PROFILE PAGE
// ==============================
const getProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.user.id).select("username email addresses");

    if (!userData) {
      return res.redirect(
        "/auth/login?error=" + encodeURIComponent("User not found")
      );
    }

    res.render("user/profile", {
      user: userData.username,
      email: userData.email,
      addresses: userData.addresses,
      query: req.query,
    });

  } catch (error) {
    console.error("getProfile error:", error);
    return res.redirect(
      "/auth/home?error=" + encodeURIComponent("Unable to load profile")
    );
  }
};

// ==============================
// UPDATE PERSONAL DETAILS
// ==============================
const postEditPersonalDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();

    if (!username || !email) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("Username and email are required.")
      );
    }

    // email already exists 
    const existingUser = await User.findOne({
      email: email,
      _id: { $ne: userId } // not current user
    });

    if (existingUser) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("Email already exists. Try another one.")
      );
    }

    await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true, runValidators: true }
    );

    return res.redirect(
      "/auth/profile?success=" + encodeURIComponent("Personal info updated successfully.")
    );
  } catch (error) {
    console.error("postEditPersonalDetails error:", error);
    return res.redirect(
      "/auth/profile?error=" + encodeURIComponent("Failed to update profile.")
    );
  }
};

// ==============================
// ADD / EDIT SHIPPING ADDRESS
// ==============================
const postEditShippingDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const addressId = req.body.addressId?.trim(); // hidden field (optional)

    const AddressType = req.body.AddressType?.trim();
    const BuildingName = req.body.BuildingName?.trim();
    const street = req.body.street?.trim();
    const city = req.body.city?.trim();
    const state = req.body.state?.trim();
    const zip = req.body.zip?.trim();
    const phone = req.body.phone?.trim();

    if (!AddressType || !BuildingName || !street || !city || !state || !zip) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("All address fields are required.")
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("User not found.")
      );
    }

    // EDIT ADDRESS
    if (addressId) {
      const existingAddress = user.addresses.id(addressId);

      if (!existingAddress) {
        return res.redirect(
          "/auth/profile?error=" + encodeURIComponent("Address not found.")
        );
      }

      existingAddress.AddressType = AddressType;
      existingAddress.BuildingName = BuildingName;
      existingAddress.street = street;
      existingAddress.city = city;
      existingAddress.state = state;
      existingAddress.zip = zip;
      existingAddress.phone = phone;

      await user.save();

      return res.redirect(
        "/auth/profile?success=" + encodeURIComponent("Address updated successfully.")
      );
    }

    // ADD NEW ADDRESS
    user.addresses.push({
      AddressType,
      BuildingName,
      street,
      city,
      state,
      zip,
      phone,
      isDefault: user.addresses.length === 0, // first address becomes default
    });

    await user.save();

    return res.redirect(
      "/auth/profile?success=" + encodeURIComponent("New address added successfully.")
    );

  } catch (error) {
    console.error("postEditShippingDetails error:", error);
    return res.redirect(
      "/auth/profile?error=" + encodeURIComponent("Failed to save address.")
    );
  }
};

// ==============================
// SET DEFAULT ADDRESS
// ==============================
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.body.addressId?.trim();

    if (!addressId) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("Address ID missing.")
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("User not found.")
      );
    }

    // remove default from all
    user.addresses.forEach((addr) => (addr.isDefault = false));

    // set selected default
    const selected = user.addresses.id(addressId);

    if (!selected) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("Address not found.")
      );
    }

    selected.isDefault = true;

    await user.save();

    return res.redirect(
      "/auth/profile?success=" + encodeURIComponent("Default address updated successfully.")
    );
  } catch (error) {
    console.error("setDefaultAddress error:", error);
    return res.redirect(
      "/auth/profile?error=" + encodeURIComponent("Failed to set default address.")
    );
  }
};

// ==============================
// REMOVE ADDRESS
// ==============================
const removeAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.body.addressId?.trim();

    if (!addressId) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("Address ID missing.")
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("User not found.")
      );
    }

    const removedAddress = user.addresses.id(addressId);

    if (!removedAddress) {
      return res.redirect(
        "/auth/profile?error=" + encodeURIComponent("Address not found.")
      );
    }

    const wasDefault = removedAddress.isDefault;

    removedAddress.deleteOne();

    // if default deleted, make first address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.redirect(
      "/auth/profile?success=" + encodeURIComponent("Address removed successfully.")
    );
  } catch (error) {
    console.error("removeAddress error:", error);
    return res.redirect(
      "/auth/profile?error=" + encodeURIComponent("Failed to remove address.")
    );
  }
};

export {
  getProfile,
  postEditPersonalDetails,
  postEditShippingDetails,
  setDefaultAddress,
  removeAddress,
};
