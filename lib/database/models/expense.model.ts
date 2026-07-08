import { Schema, model, models } from "mongoose";

const ExpenseSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    referenceNumber: { type: String },
    description: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Expense = models.Expense || model("Expense", ExpenseSchema);

export default Expense;
