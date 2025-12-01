import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: "Mobile missing" });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: 15000,
      currency: "INR",
      receipt: `receipt_${mobile}_${Date.now()}`,
      payment_capture: 1
    });

    res.json({ order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Order creation failed" });
  }
}
