import crypto from "crypto";
import admin from "../firebase-admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const db = admin.firestore();

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    mobile,
    formData
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid Signature" });
  }

  try {
    // Generate unique ID
    const metaRef = db.collection("metadata").doc("counters");
    const metaSnap = await metaRef.get();

    let last = 1000;
    if (metaSnap.exists) last = metaSnap.data().lastTigerIdNumber;

    const newId = last + 1;
    await metaRef.set({ lastTigerIdNumber: newId }, { merge: true });

    const uniqueId = "TOS" + newId;

    // Save final user data
    await db.collection("users").doc(mobile).set({
      ...formData,
      mobile,
      uniqueId,
      status: "paid",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paidAt: Date.now()
    });

    // Remove draft
    await db.collection("drafts").doc(mobile).delete();

    return res.json({ success: true, uniqueId });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
}
