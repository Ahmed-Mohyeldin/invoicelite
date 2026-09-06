"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [companyPhone, setCompanyPhone] = useState(""); // رقم تليفون الشركة
  const [companyEmail, setCompanyEmail] = useState(""); // إيميل الشركة
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
        
      if (data) {
        setCompanyName(data.company_name || "");
        setCompanyAddress(data.company_address || "");
        setTaxNumber(data.tax_number || "");
        setCompanyPhone(data.company_phone || "");
        setCompanyEmail(data.company_email || "");
      }
    }
    setFetching(false);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("settings")
      .upsert({
        user_id: user.id,
        company_name: companyName,
        company_address: companyAddress,
        tax_number: taxNumber,
        company_phone: companyPhone,
        company_email: companyEmail
      });

    if (error) {
      alert("حصلت مشكلة في الحفظ: " + error.message);
    } else {
      alert("تم حفظ بيانات الشركة بنجاح! 🏢");
      window.location.href = "/";
    }
    setLoading(false);
  };

  if (fetching) return <p className="p-10 text-center text-black">جاري التحميل...</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        <p className="mt-2 text-gray-600">بيانات شركتك اللي هتظهر في الفواتير للعملاء.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name (اسم الشركة)</label>
            <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="Zara Jeans" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Address (العنوان)</label>
            <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="Cairo, Alzhazra" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (رقم الهاتف)</label>
              <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="01000000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (البريد الإلكتروني)</label>
              <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="info@zarajeans.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Registration Number (الرقم الضريبي)</label>
            <input type="text" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" placeholder="1232323232" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? "جاري الحفظ..." : "Save Settings"}
            </button>
            <button type="button" onClick={() => window.location.href = "/"} className="rounded-xl border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}