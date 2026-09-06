"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserAndFetchInvoices();
  }, []);

  const checkUserAndFetchInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id) 
      .order("created_at", { ascending: false }); 

    if (data) {
      setInvoices(data);
    }
    setLoading(false);
  };

  const totalInvoices = invoices.length;
  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your invoices and quotes.</p>
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-red-600 font-semibold hover:underline"
          >
            تسجيل الخروج
          </button>
        </div>

        {/* Quick Actions */}
<div className="flex flex-wrap items-center gap-3 mb-8">
  <Link 
    href="/create" 
    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
  >
    <span className="text-lg">➕</span> 
    <span>Create Invoice</span>
  </Link>

  <Link 
    href="/invoices" 
    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
  >
    <span className="text-lg">📑</span> 
    <span>All Invoices</span>
  </Link>

  <Link 
    href="/products" 
    className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition shadow-sm"
  >
    <span className="text-lg">📦</span> 
    <span>Products</span>
  </Link>

  <Link 
    href="/settings" 
    className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-900 transition shadow-sm"
  >
    <span className="text-lg">⚙️</span> 
    <span>Settings</span>
  </Link>
</div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">{totalInvoices}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Sales</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">EGP {totalSales.toLocaleString()}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">{pendingInvoices}</h2>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Recent Invoices</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Client</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Phone</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">جاري تحميل الفواتير...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">لا توجد فواتير حتى الآن. ابدأ بعمل أول فاتورة!</td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-gray-100">
                      <td className="p-4 font-medium text-gray-900">{invoice.client_name}</td>
                      <td className="p-4 text-gray-700">{invoice.client_phone || "-"}</td>
                      <td className="p-4 text-gray-700 font-bold">{invoice.total}</td>
                      <td className="p-4">
                        <span className="rounded-full px-3 py-1 text-sm bg-yellow-100 text-yellow-700">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <a 
                          href={`/invoice/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-sm transition"
                        >
                          عرض / طباعة 📄
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}