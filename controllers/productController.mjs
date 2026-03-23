import Products from "../models/productModel.mjs";

/* ADD product */
const getaddProducts = async (req, res) => {
  try {
    console.log(`hit get add prooducts`);
    res.render("admin/addProducts", {query: req.query});
  } catch (err) {
    console.log(err);
     return res.redirect("/admin/dashboard");
  }
};

const postaddProducts = async (req, res) => {
  try {
    
    const { name, category, price, stock ,unit, description, brand, displayType } = req.body;
    const image =req.file;

    if (!req.body) {
      console.log(`Error in req.body`);
      return res.redirect(
        "/admin/dashboard?error=" +
          encodeURIComponent("")
      );
    }

    if (!image) {
      console.log(`Error in req.file (image)`);
      return res.redirect(
        "/admin/dashboard?error=" +
          encodeURIComponent("")
      );
    }

    // Check Duplicate
    const existingProduct = await Products.findOne({
      name: name.trim(),
      brand: brand.trim(),
      category
    });

    if (existingProduct) {
      return res.redirect(
        "/admin/products/addProducts?error=" + encodeURIComponent("Product already exists"));
    }

    await Products.create({
      name,
      category,
      brand,
      price,
      stock,
      unit,
      description,
      displayType,
      image: req.file.filename
    });
    console.log(`New Product ${name} added`);

    res.redirect("/admin/products/addProducts?success="+ encodeURIComponent("New Product added Successfully"));
  } catch (err) {
    console.log("Error saving product:", err);
    return res.redirect("/admin/dashboard");
  }
};

/* MODIFY product */
const getupdateProducts = async (req, res) => {
  try{
  const { id } = req.params;
  const product = await Products.findById(id);
  res.render("admin/editProducts",{query: req.query,product});
}catch(err){
  console.log(`Error in get update products`,err);
   return res.redirect("/admin/dashboard?view=products&error="+ encodeURIComponent("Cannot get the products updation page"));
}};

const postupdateProducts = async (req,res) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock, unit, description, brand, displayType } = req.body;
    const updateData = { name, category, price, stock, unit, description, brand ,displayType};

    if (req.file) {
      updateData.image = req.file.filename;
    }

    await Products.findByIdAndUpdate(id, updateData);

    console.log(`${name}: updated Succussfully`)
    res.redirect("/admin/dashboard?view=products&success="+ encodeURIComponent("Product updated Successfully"));
    
  } catch (error) {
    console.log(`Error in post update products`,err);
   return res.redirect("/admin/dashboard?view=products&error="+ encodeURIComponent("Error in updating product"));
  }
  
}

//Block & UnBlock Product
const toggleProductStatus = async (req, res) => {
  const product = await Products.findById(req.params.id);

  if (!product) {
    return res.redirect("/admin/dashboard?view=products&error=Product not found");
  }

  product.status = product.status === "active" ? "blocked" : "active";
  await product.save();

  res.redirect(
    "/admin/dashboard?view=products&success=" +
      encodeURIComponent(product.status === "blocked" ? "Product blocked successfully" : "Product unblocked successfully")
  );
};



export {
  getaddProducts,
  postaddProducts,
  getupdateProducts,
  postupdateProducts,
  toggleProductStatus
}
