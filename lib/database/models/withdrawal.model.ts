import { Schema, model, models } from "mongoose";

const WithdrawalSchema = new Schema(
  {
    owner: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance optimization on large data sets
WithdrawalSchema.index({ owner: 1, date: -1, createdAt: -1 });

const Withdrawal = models.Withdrawal || model("Withdrawal", WithdrawalSchema);

export default Withdrawal;
