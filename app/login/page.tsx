"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // دالة تسجيل الدخول
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ خطأ في الإيميل أو الباسورد: " + error.message);
    } else {
      setMessage("✅ تم تسجيل الدخول بنجاح! جاري تحويلك...");
      router.push("/"); // بيحولك للداشبورد
    }
    setLoading(false);
  };

  // دالة إنشاء حساب جديد
  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("❌ حصلت مشكلة: " + error.message);
    } else {
      setMessage("✅ تم إنشاء الحساب بنجاح! تقدر تسجل دخول دلوقتي.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-black">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">InvoiceLite</h1>
          <p className="text-gray-500">سجل دخولك لإدارة فواتيرك</p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-gray-100 text-sm font-medium text-center">
            {message}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني (Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-left"
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white text-black rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-left"
              placeholder="********"
              dir="ltr"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "جاري التحميل..." : "تسجيل الدخول"}
            </button>
            
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full rounded-xl bg-white border border-blue-600 text-blue-600 px-6 py-3 font-bold hover:bg-blue-50 transition disabled:opacity-50"
            >
              إنشاء حساب جديد
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}