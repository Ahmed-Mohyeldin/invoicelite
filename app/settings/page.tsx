"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    setUser(userData.user);

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (data) {
      setCompanyName(data.company_name || "");
      setCompanyPhone(data.company_phone || "");
      setCompanyAddress(data.company_address || "");
      setTaxNumber(data.tax_number || "");
      setLogoUrl(data.logo_url || "");
    }
    setLoading(false);
  };

  // دالة رفع الشعار (Logo) كـ Base64 لتسهيل التخزين بدون إعدادات معقدة
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setLogoUrl(reader.result as string);
      setUploadingImage(false);
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updates = {
      user_id: user.id,
      company_name: companyName,
      company_phone: companyPhone,
      company_address: companyAddress,
      tax_number: taxNumber,
      logo_url: logoUrl,
    };

    const { error } = await supabase
      .from("settings")
      .upsert(updates, { onConflict: 'user_id' }); // بيحدث لو موجود أو ينشئ جديد

    if (error) {
      alert("حدث خطأ أثناء الحفظ: " + error.message);
    } else {
      alert("تم حفظ إعدادات الشركة بنجاح! ✅");
    }
    setSaving(false);
  };

  if (loading) return <p className="p-10 text-center text-black">جاري تحميل الإعدادات...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 text-black font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800">إعدادات الشركة ⚙️</h1>
            <p className="text-sm text-gray-500 mt-1">البيانات دي هتظهر في كل فواتيرك بشكل أوتوماتيك.</p>
          </div>
          <Link href="/" className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            الرئيسية 🏠
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* قسم رفع الشعار */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
            <label className="block text-sm font-bold text-blue-900 mb-4">شعار الشركة (Company Logo)</label>
            
            {logoUrl ? (
              <div className="relative mb-4">
                <img src={logoUrl} alt="Company Logo" className="max-h-32 object-contain rounded-lg shadow-sm bg-white p-2" />
                <button 
                  type="button" 
                  onClick={() => setLogoUrl("")} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-white border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center mb-4">
                <span className="text-3xl">🏢</span>
              </div>
            )}

            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            {uploadingImage && <p className="text-xs text-blue-600 mt-2">جاري رفع الصورة...</p>}
          </div>

          {/* بيانات الشركة */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم الشركة (Company Name)</label>
              <input 
                type="text" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="مثال: InvoiceLite System"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الهاتف (Phone Number)</label>
              <input 
                type="text" 
                value={companyPhone} 
                onChange={(e) => setCompanyPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="01xxxxxxxxx"
                maxLength={11}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">العنوان (Address)</label>
              <input 
                type="text" 
                value={companyAddress} 
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="مثال: القاهرة، مصر"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الرقم الضريبي (Tax ID) - اختياري</label>
              <input 
                type="text" 
                value={taxNumber} 
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="123-456-789"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving || uploadingImage}
            className="w-full bg-gray-800 text-white p-4 rounded-xl font-bold text-lg hover:bg-gray-900 transition shadow-md disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات 💾"}
          </button>

        </form>

      </div>
    </div>
  );
}