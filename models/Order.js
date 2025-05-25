import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["hazırlanıyor", "kargoda", "teslim edildi"],
      default: "hazırlanıyor",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
