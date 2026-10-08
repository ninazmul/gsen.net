import { Schema, model, models } from "mongoose";

const SettlementSchema = new Schema(
  {
    fromOwner: { type: String, required: true },
    toOwner: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer"],
      default: "Cash",
    },
    date: { type: Date, required: true, default: Date.now },
    month: { type: Number },
    year: { type: Number },
    notes: { type: String },
    createdAdminEmail: { type: String },
  },
  { timestamps: true }
);

SettlementSchema.index({ fromOwner: 1, toOwner: 1, date: -1 });

const Settlement = models.Settlement || model("Settlement", SettlementSchema);

export default Settlement;
