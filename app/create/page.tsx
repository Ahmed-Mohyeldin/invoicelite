"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateInvoice() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  
  const [items, setItems] = useState([{ description: "", quantity: 1, price: 0 }]);
  
  const [discount, setDiscount] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [taxPercent, setTaxPercent] = useState<number | "">("");
  const [servicePercent, setServicePercent] = useState<number | "">("");
  
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field as keyof typeof newItems[number]] = value;
    setItems(newItems);
  };

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const discountValue = Number(discount) || 0;
  let discountAmount = discountType === 'percentage' ? subTotal * (discountValue / 100) : discountValue;
  const netSubTotal = Math.max(0, subTotal - discountAmount);
  const taxAmount = netSubTotal * ((Number(taxPercent) || 0) / 100);
  const serviceAmount = netSubTotal * ((Number(servicePercent) || 0) / 100);
  const finalTotal = netSubTotal + taxAmount + serviceAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert("يجب تسجيل الدخول أولاً!");
      router.push("/login");
      return;
    }

    const { data: invoiceData, error: invoiceError } = await supabase.from("invoices").insert([
      {
        user_id: userData.user.id,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        discount: discountValue,
        discount_type: discountType,
        tax_percent: Number(taxPercent) || 0,
        service_percent: Number(servicePercent) || 0,
        total: finalTotal,
        status: 'pending',
        payment_method: paymentMethod,
      }
    ]).select().single();

    if (invoiceError || !invoiceData) {
      alert("حدث خطأ أثناء حفظ الفاتورة: " + invoiceError?.message);
      setLoading(false);
      return;
    }

    const invoiceItems = items.map(item => ({
      invoice_id: invoiceData.id,
      description: item.description,
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);

    if (itemsError) {
      alert("حدث خطأ أثناء حفظ بنود الفاتورة: " + itemsError.message);
      setLoading(false);
      return;
    }

    router.push(`/invoice/${invoiceData.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 text-black font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-black text-blue-600">إنشاء فاتورة جديدة 📄</h1>
          <Link href="/" className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            الرئيسية 🏠
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* بيانات العميل وطريقة الدفع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل *</label>
              <input 
                type="text" 
                required
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)}
                placeholder="أدخل اسم العميل"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
              <input 
              type="tel" 
              value={clientPhone} 
              onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))} // بيقبل أرقام فقط ويحذف أي حروف
              placeholder="01xxxxxxxxx"
              maxLength={11} // لو حابب تحدده بـ 11 رقم مثلاً
              className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني للإرسال 📧</label>
              <input 
                type="email" 
                value={clientEmail} 
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">طريقة الدفع (Payment Method)</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white font-semibold text-blue-700"
              >
                <option value="Cash">💵 Cash (نقدي)</option>
                <option value="Wallets">📱 Banking Wallets (محافظ إلكترونية)</option>
                <option value="Instapay">🏦 Instapay / Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* بنود الفاتورة مع Headers واضحة */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">بنود الفاتورة (Items)</h3>
            
            <div className="flex gap-3 mb-2 text-xs font-bold text-gray-600 px-1">
              <span className="flex-1">وصف المنتج أو الخدمة</span>
              <span className="w-20 text-center">العدد (Qty)</span>
              <span className="w-28 text-center">السعر (Price)</span>
              <span className="w-10"></span>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-3 mb-3 items-center">
                <input 
                  type="text" 
                  required
                  placeholder="وصف الخدمة أو المنتج"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-xl"
                />
                <input 
                  type="number" 
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  className="w-20 p-3 border border-gray-300 rounded-xl text-center"
                  placeholder="العدد"
                />
                <input 
                  type="number" 
                  min="0"
                  required
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                  className="w-28 p-3 border border-gray-300 rounded-xl text-center"
                  placeholder="السعر"
                />
                {items.length > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="bg-red-100 text-red-600 w-10 h-12 rounded-xl font-bold flex items-center justify-center"
                  >
                    ✕
                  </button>
                ) : (
                  <div className="w-10"></div>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addItem}
              className="text-blue-600 font-bold text-sm mt-1 hover:underline"
            >
              + إضافة بند آخر
            </button>
          </div>

          {/* الخصم والضرائب */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الخصم (Discount)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="0"
                  value={discount} 
                  onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="قيمة الخصم"
                  className="w-full p-2 border rounded-lg text-sm"
                />
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="p-2 border rounded-lg text-sm bg-white font-medium"
                >
                  <option value="fixed">قيمة ثابتة (EGP)</option>
                  <option value="percentage">نسبة مئوية (%)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الضريبة (%)</label>
              <input 
                type="number" 
                min="0"
                value={taxPercent} 
                onChange={(e) => setTaxPercent(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="مثال: 14"
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الخدمة / مصاريف إدارية (%)</label>
              <input 
                type="number" 
                min="0"
                value={servicePercent} 
                onChange={(e) => setServicePercent(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="مثال: 5"
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* الإجمالي النهائي */}
          <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
            <span className="font-bold text-blue-900">الإجمالي النهائي:</span>
            <span className="text-2xl font-black text-blue-900">EGP {finalTotal.toLocaleString()}</span>
          </div>

          {/* زر الحفظ */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? "جاري الحفظ..." : "حفظ وإنشاء الفاتورة 🚀"}
          </button>

        </form>

      </div>
    </div>
  );
}