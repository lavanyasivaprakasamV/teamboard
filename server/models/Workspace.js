import mongoose from "mongoose";
import crypto from "crypto";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  { _id: false },
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSchema],
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(4).toString("hex"),
    },
  },
  { timestamps: true },
);

export default mongoose.model("Workspace", workspaceSchema);
