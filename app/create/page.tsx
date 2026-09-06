"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreateInvoicePage() {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [tax, setTax] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("لازم تسجل دخول الأول!");
      window.location.href = "/login";
      return;
    }

    const total = (quantity * Number(price)) + Number(tax);

    const { data, error } = await supabase
      .from("invoices")
      .insert([
        {
          user_id: user.id, 
          client_name: clientName,
          client_phone: clientPhone,
          total: total,
          status: "pending"
        }
      ])
      .select();

    if (error) {
      alert("حصلت مشكلة في الحفظ: " + error.message);
    } else if (data) {
      const invoiceId = data[0].id;
      await supabase.from("invoice_items").insert([
        {
          invoice_id: invoiceId,
          description: item,
          quantity: Number(quantity),
          price: Number(price)
        }
      ]);

      alert("تم حفظ الفاتورة بنجاح! 🎉");
      // التحويل العادي اللي بيجبر الصفحة تحمل
      window.location.href = "/"; 
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to create a new invoice.
        </p>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Ahmed Ali"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="01012345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item / Service
            </label>
            <input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Web design"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="2500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax
              </label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "جاري الحفظ..." : "Save Invoice"}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = "/"}
              className="rounded-xl border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}