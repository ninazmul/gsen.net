import { Schema, model, models } from "mongoose";

const OwnerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    default: "",
  },
});

const SettingsSchema = new Schema(
  {
    owners: [OwnerSchema],
  },
  { timestamps: true },
);

const Settings = models.Settings || model("Settings", SettingsSchema);

export default Settings;
