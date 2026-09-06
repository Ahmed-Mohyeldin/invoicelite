"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInvoices();
  }, []);

  const fetchUserInvoices = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setInvoices(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;

    await supabase.from("invoice_items").delete().eq("invoice_id", id);
    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (!error) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
    } else {
      alert("حدث خطأ أثناء الحذف: " + error.message);
    }
  };

  if (loading) return <p className="p-10 text-center" style={{ color: '#000' }}>جاري تحميل الفواتير...</p>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px', color: '#111827', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* رأس الصفحة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: '0 0 4px 0' }}>قائمة الفواتير 📋</h1>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>إدارة ومتابعة جميع الفواتير الصادرة لعملائك</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link 
              href="/" 
              style={{ backgroundColor: '#4b5563', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', textDecoration: 'none' }}
            >
              الرئيسية 🏠
            </Link>
            <Link 
              href="/create" 
              style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              + إنشاء فاتورة جديدة
            </Link>
          </div>
        </div>

        {/* الجدول أو الحالة الفارغة */}
        {invoices.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', padding: '48px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>لا توجد فواتير مسجلة لحسابك حتى الآن.</p>
            <Link 
              href="/create" 
              style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'underline' }}
            >
              أنشئ فاتورتك الأولى الآن 🚀
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '13px', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px' }}>رقم الفاتورة</th>
                  <th style={{ padding: '16px' }}>العميل</th>
                  <th style={{ padding: '16px' }}>التاريخ</th>
                  <th style={{ padding: '16px' }}>الإجمالي (EGP)</th>
                  <th style={{ padding: '16px' }}>طريقة الدفع</th>
                  <th style={{ padding: '16px' }}>الحالة</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#2563eb' }}>
                      #{inv.id.slice(0, 6)}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#111827' }}>
                      {inv.client_name}
                    </td>
                    <td style={{ padding: '16px', color: '#4b5563', fontWeight: '600' }}>
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '900', color: '#111827' }}>
                      {inv.total.toLocaleString()}
                    </td>
                    
                    {/* هنا مكان الـ TDs الجديدة */}
                    <td style={{ padding: '16px', fontWeight: '600', color: '#4b5563' }}>
                      {inv.payment_method || 'Cash'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: inv.status === 'paid' ? '#dcfce7' : inv.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                        color: inv.status === 'paid' ? '#16a34a' : inv.status === 'cancelled' ? '#dc2626' : '#d97706'
                      }}>
                        {inv.status || 'pending'}
                      </span>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <Link 
                          href={`/invoice/${inv.id}`}
                          style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                        >
                          عرض 👁️
                        </Link>
                        <button 
                          onClick={() => handleDelete(inv.id)}
                          style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}