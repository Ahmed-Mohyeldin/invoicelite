"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function InvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, []);

  const fetchInvoiceAndSettings = async () => {
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", params.id)
      .single();

    if (invoiceData) {
      setInvoice(invoiceData);
      
      const { data: itemsData } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceData.id);
      
      if (itemsData) setItems(itemsData);

      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", invoiceData.user_id)
        .single();
        
      if (settingsData) setSettings(settingsData);
    }
    setLoading(false);
  };

  // دالة تغيير حالة الفاتورة (Pending / Paid / Cancelled)
  const handleStatusChange = async (newStatus: string) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", params.id);

    if (!error) {
      setInvoice({ ...invoice, status: newStatus });
      alert(`تم تحديث حالة الفاتورة إلى: ${newStatus.toUpperCase()} ✅`);
    } else {
      alert("حدث خطأ أثناء تحديث الحالة: " + error.message);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = invoiceRef.current;
      
      const options = {
        margin:       10,
        filename:     `Invoice-${invoice.id.slice(0, 6)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(options).save();
    } catch (err: any) {
      alert("حدث خطأ أثناء تحميل الـ PDF: " + err.message);
    }
    setDownloading(false);
  };

  const handleSendEmail = async () => {
    if (!invoice.client_email) {
      alert("عذراً، هذا العميل ليس لديه بريد إلكتروني مسجل!");
      return;
    }

    setSending(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = invoiceRef.current;
      
      const options = {
        margin:       10,
        filename:     `Invoice-${invoice.id.slice(0, 6)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBase64 = await html2pdf().from(element).set(options).outputPdf('datauristring');

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: invoice.client_email,
          clientName: invoice.client_name,
          invoiceId: invoice.id,
          total: invoice.total,
          pdfBase64: pdfBase64,
        }),
      });

      if (response.ok) {
        alert("تم إرسال الفاتورة مع ملف الـ PDF بنجاح! 🚀");
      } else {
        alert("فشل الإرسال.");
      }
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
    setSending(false);
  };

  if (loading) return <p className="p-10 text-center" style={{ color: '#000' }}>جاري التحميل...</p>;
  if (!invoice) return <p className="p-10 text-center" style={{ color: '#000' }}>الفاتورة غير موجودة!</p>;

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const discountValue = invoice.discount || 0;
  const discountType = invoice.discount_type || 'fixed';
  let discountAmount = discountType === 'percentage' ? subTotal * (discountValue / 100) : discountValue;
  const netSubTotal = Math.max(0, subTotal - discountAmount);
  const taxPercent = invoice.tax_percent || 0;
  const servicePercent = invoice.service_percent || 0;
  const taxAmount = netSubTotal * (taxPercent / 100);
  const serviceAmount = netSubTotal * (servicePercent / 100);

  // لون شارة الحالة
  const statusColor = 
    invoice.status === 'paid' ? '#16a34a' : 
    invoice.status === 'cancelled' ? '#dc2626' : '#d97706';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#111827' }}>
      
      {/* شريط التحكم العلوي (تغيير الحالة والرجوع) */}
      <div style={{ width: '100%', maxWidth: '768px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="print:hidden">
        <Link href="/invoices" style={{ backgroundColor: '#4b5563', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
          ← رجوع للقائمة
        </Link>

        {/* أزرار تغيير حالة الفاتورة */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>الحالة:</span>
          <button 
            onClick={() => handleStatusChange('pending')}
            style={{ backgroundColor: invoice.status === 'pending' ? '#fef3c7' : '#f3f4f6', color: '#d97706', border: '1px solid #fcd34d', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Pending
          </button>
          <button 
            onClick={() => handleStatusChange('paid')}
            style={{ backgroundColor: invoice.status === 'paid' ? '#dcfce7' : '#f3f4f6', color: '#16a34a', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Paid 💰
          </button>
          <button 
            onClick={() => handleStatusChange('cancelled')}
            style={{ backgroundColor: invoice.status === 'cancelled' ? '#fee2e2' : '#f3f4f6', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Cancelled ❌
          </button>
        </div>
      </div>

      {/* صندوق الفاتورة */}
      <div 
        ref={invoiceRef} 
        style={{ 
          backgroundColor: '#ffffff', 
          color: '#111827', 
          width: '100%', 
          maxWidth: '768px', 
          padding: '40px', 
          borderRadius: '16px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #d1d5db',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '32px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#2563eb', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>INVOICE</h1>
            <p style={{ color: '#374151', fontSize: '14px', fontWeight: '600', margin: 0 }}># {invoice.id}</p>
            {/* شارة الحالة داخل الفاتورة */}
            <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: statusColor + '20', color: statusColor, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {invoice.status || 'pending'}
            </span>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontWeight: '700', color: '#111827', fontSize: '24px', margin: '0 0 4px 0' }}>
              {settings?.company_name || "InvoiceLite System"}
            </h2>
            {settings?.company_address && <p style={{ color: '#1f2937', fontSize: '14px', margin: '4px 0 0 0' }}>{settings.company_address}</p>}
            {settings?.company_phone && <p style={{ color: '#1f2937', fontSize: '14px', margin: '4px 0 0 0' }}>{settings.company_phone}</p>}
            {settings?.tax_number && <p style={{ color: '#111827', fontSize: '14px', margin: '6px 0 0 0', fontWeight: '700' }}>Tax ID: {settings.tax_number}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '24px', marginBottom: '32px', border: '1px solid #e5e7eb' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#374151', margin: '0 0 8px 0', textTransform: 'uppercase' }}>BILLED TO:</p>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>{invoice.client_name}</h3>
            <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '4px 0 0 0' }}>{invoice.client_phone}</p>
            {invoice.client_email && <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '4px 0 0 0' }}>{invoice.client_email}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#374151', margin: '0 0 8px 0', textTransform: 'uppercase' }}>PAYMENT METHOD:</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb', margin: '0 0 8px 0' }}>
              {invoice.payment_method === 'Cash' ? '💵 Cash (نقدي)' :
               invoice.payment_method === 'Wallets' ? '📱 Banking Wallets (محافظ إلكترونية)' :
               invoice.payment_method === 'Instapay' ? '🏦 Instapay / Bank Transfer' : '💵 Cash'}
            </p>
            <p style={{ color: '#374151', fontSize: '13px', fontWeight: '600', margin: 0 }}>Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <table style={{ width: '100%', textAlign: 'left', marginBottom: '32px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #d1d5db', color: '#111827', fontSize: '14px', fontWeight: '700' }}>
              <th style={{ paddingBottom: '12px' }}>Description</th>
              <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Qty</th>
              <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Price</th>
              <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px 0', color: '#111827', fontWeight: '600' }}>{item.description}</td>
                <td style={{ padding: '16px 0', textAlign: 'center', color: '#1f2937', fontWeight: '600' }}>{item.quantity}</td>
                <td style={{ padding: '16px 0', textAlign: 'center', color: '#1f2937', fontWeight: '600'  }}>{item.price}</td>
                <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                  {(item.quantity * item.price).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '320px', color: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              <span>Subtotal:</span>
              <span>{subTotal.toLocaleString()}</span>
            </div>
            
            {discountValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '12px' }}>
                <span>Discount:</span>
                <span>- {discountAmount.toLocaleString()}</span>
              </div>
            )}
            
            {taxPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                <span>Tax ({taxPercent}%):</span>
                <span>{taxAmount.toLocaleString()}</span>
              </div>
            )}

            {servicePercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                <span>Service ({servicePercent}%):</span>
                <span>{serviceAmount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', color: '#1e3a8a', marginTop: '16px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontWeight: '800', fontSize: '14px', textTransform: 'uppercase' }}>TOTAL:</span>
              <span style={{ fontSize: '24px', fontWeight: '900' }}>EGP {invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* أزرار الإجراءات */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 print:hidden">
        <button 
          onClick={() => window.print()} 
          className="bg-gray-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-900 transition shadow-md"
        >
          طباعة 🖨️
        </button>

        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-md disabled:opacity-50"
        >
          {downloading ? "جاري التنزيل..." : "تنزيل PDF مباشر 📥"}
        </button>

        <button 
          onClick={handleSendEmail} 
          disabled={sending}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
        >
          {sending ? "جاري الإرسال..." : "إرسال عبر البريد 📧"}
        </button>
      </div>

    </div>
  );
}