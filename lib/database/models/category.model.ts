import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["Income", "Expense"], required: true },
    color: { type: String, default: "#3e0078" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category = models.Category || model("Category", CategorySchema);

export default Category;
