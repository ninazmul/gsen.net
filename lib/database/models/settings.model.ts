import { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    owners: [
      {
        name: { type: String, required: true },
        profitShare: { type: Number, required: true, default: 50 },
      },
    ],
  },
  { timestamps: true },
);

const Settings = models.Settings || model("Settings", SettingsSchema);

export default Settings;
