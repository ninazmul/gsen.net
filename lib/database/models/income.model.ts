import { Schema, model, models } from "mongoose";

const IncomeSchema = new Schema(
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
  { timestamps: true },
);

// Indexes for performance optimization on large data sets
IncomeSchema.index({ deletedAt: 1, date: -1, createdAt: -1 });
IncomeSchema.index({ category: 1, deletedAt: 1 });

const Income = models.Income || model("Income", IncomeSchema);

export default Income;
