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
    owner: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for performance optimization on large data sets
ExpenseSchema.index({ deletedAt: 1, date: -1, createdAt: -1 });
ExpenseSchema.index({ category: 1, deletedAt: 1 });

const Expense = models.Expense || model("Expense", ExpenseSchema);

export default Expense;
