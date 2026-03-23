import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    brand:{ type: String, required: true, trim: true },
    category: {type: String, enum: ["personal", "home", "gaming", "travel", "others"],required: true},
    price: { type: Number, required: true},
    stock: { type: Number, required: true},
    unit: { type: String,enum: ["nos"],default: "nos", required: true},
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    displaySection: {type: String,enum: ["exclusive", "featured", "normal"]},
    status: {type: String, enum: ["active", "blocked"], default: "active"},
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

const Products = mongoose.model("Product", productSchema);

export default Products;
