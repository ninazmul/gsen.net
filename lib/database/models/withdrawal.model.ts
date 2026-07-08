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

const Withdrawal = models.Withdrawal || model("Withdrawal", WithdrawalSchema);

export default Withdrawal;
