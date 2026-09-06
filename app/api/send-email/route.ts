import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { clientEmail, clientName, invoiceId, total, pdfBase64 } = await request.json();

    if (!clientEmail) {
      return NextResponse.json({ error: "البريد الإلكتروني للعميل غير متوفر" }, { status: 400 });
    }

    let attachments = [];
    if (pdfBase64) {
      const base64Data = pdfBase64.split(';base64,').pop();
      attachments.push({
        filename: `Invoice-${invoiceId.slice(0, 6)}.pdf`,
        content: Buffer.from(base64Data, 'base64'),
      });
    }

    const data = await resend.emails.send({
      from: 'InvoiceLite <onboarding@resend.dev>',
      to: [clientEmail],
      subject: `فاتورة جديدة رقم #${invoiceId.slice(0, 6)}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; color: #111827; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; text-align: right;">
          <h2 style="color: #2563eb; margin-top: 0;">فاتورة جديدة من شركتك</h2>
          <p>مرحباً <strong>${clientName}</strong>،</p>
          <p>تم إصدار فاتورة جديدة لك بقيمة إجمالية:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
            EGP ${total.toLocaleString()}
          </div>
          <p style="color: #374151; font-size: 14px;">تجود تجد مرفقاً ملف الـ PDF الخاص بالفاتورة بالتفاصيل الكاملة.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">تم إرسال هذه الرسالة عبر نظام InvoiceLite الفوري.</p>
        </div>
      `,
      attachments,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}