"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

  const fetchInvoiceData = async () => {
    // 1. جلب بيانات الفاتورة الأساسية
    const { data: invData, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    // 2. جلب المنتجات/الخدمات الخاصة بالفاتورة
    const { data: itemsData } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    if (invData) setInvoice(invData);
    if (itemsData) setItems(itemsData);
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center text-black font-bold text-xl">جاري تحميل الفاتورة... ⏳</div>;
  if (!invoice) return <div className="p-10 text-center text-red-600 font-bold text-xl">الفاتورة غير موجودة ❌</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-black">
      {/* 
        id="invoice-content" بيحدد الجزء اللي هيطبع
        print:hidden بتخفي الزرار ده وقت الطباعة عشان ميظهرش في الـ PDF
      */}
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-blue-600 px-8 py-3 text-white font-bold hover:bg-blue-700 transition shadow-lg"
          >
            📄 تنزيل PDF / طباعة
          </button>
        </div>

        <div className="rounded-2xl bg-white p-12 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b pb-8">
            <div>
              <h1 className="text-5xl font-extrabold text-blue-600 tracking-wider">INVOICE</h1>
              <p className="text-gray-500 mt-2 font-mono text-sm"># {invoice.id}</p>
            </div>
            <div className="text-left md:text-right mt-6 md:mt-0">
              <h2 className="font-bold text-gray-900 text-xl">InvoiceLite System</h2>
              <p className="text-gray-500 mt-1">info@invoicelite.com</p>
            </div>
          </div>

          <div className="mb-12 bg-gray-50 p-6 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-sm">Billed To:</h3>
            <p className="text-gray-900 font-semibold text-lg">{invoice.client_name}</p>
            <p className="text-gray-600">{invoice.client_phone || "رقم الهاتف غير متوفر"}</p>
            <p className="text-gray-500 mt-3 text-sm">
              Date: {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>

          <table className="w-full text-left mb-12">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-700 rounded-l-lg">Description</th>
                <th className="p-4 font-semibold text-gray-700 text-center">Qty</th>
                <th className="p-4 font-semibold text-gray-700 text-center">Price</th>
                <th className="p-4 font-semibold text-gray-700 text-right rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="p-4 text-gray-900 font-medium">{item.description}</td>
                  <td className="p-4 text-gray-700 text-center">{item.quantity}</td>
                  <td className="p-4 text-gray-700 text-center">{item.price}</td>
                  <td className="p-4 text-gray-900 font-bold text-right">
                    {(item.quantity * item.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 bg-blue-50 p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700 text-lg">Total Amount:</span>
                <span className="font-extrabold text-blue-700 text-2xl">EGP {Number(invoice.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}