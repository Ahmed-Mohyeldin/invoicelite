"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Papa from "papaparse";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // حالة التعديل (Edit State)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ item_code: "", description: "", price: 0 });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  const downloadTemplate = () => {
    const csvContent = "Code,Name,Price\n"; 
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Products_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: async (results) => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const newProducts = results.data.map((row: any) => ({
          user_id: userData.user.id,
          // تحويل القيمة لنص ثم إزالة أي شيء ليس رقماً
          item_code: String(row.item_code || row.code || row.Code || "").replace(/\D/g, ""),
          description: row.description || row.name || row.Name || row.Product || "",
          price: Number(row.price || row.Price || 0),
        })).filter((p: any) => p.description);

        if (newProducts.length === 0) {
          alert("لم يتم العثور على منتجات صالحة في الملف. تأكد من وجود أعمدة: Name, Price");
          setUploading(false);
          return;
        }

        const { error } = await supabase.from("products").insert(newProducts);

        if (error) {
          alert("حدث خطأ أثناء رفع المنتجات: " + error.message);
        } else {
          alert(`تم رفع ${newProducts.length} منتج بنجاح! ✅`);
          fetchProducts(); 
        }
        setUploading(false);
      },
      error: (error) => {
        alert("خطأ في قراءة الملف: " + error.message);
        setUploading(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("خطأ أثناء الحذف!");
    } else {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setEditForm({
      item_code: product.item_code || "",
      description: product.description || "",
      price: product.price || 0
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update({
        item_code: editForm.item_code,
        description: editForm.description,
        price: Number(editForm.price)
      })
      .eq("id", id);

    if (error) {
      alert("خطأ أثناء الحفظ: " + error.message);
    } else {
      setProducts(products.map(p => p.id === id ? { ...p, ...editForm, price: Number(editForm.price) } : p));
      setEditingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 text-black font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-blue-600">إدارة المنتجات 📦</h1>
            <p className="text-sm text-gray-500 mt-1">ارفع قائمة منتجاتك لتسهيل اختيارها أثناء إنشاء الفاتورة.</p>
          </div>
          <Link href="/" className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            الرئيسية 🏠
          </Link>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-blue-900 mb-1">رفع منتجات بالجملة (CSV)</h3>
            <p className="text-xs text-blue-700 mb-2">تأكد أن الملف يحتوي على أعمدة: Code, Name, Price</p>
            <button 
              onClick={downloadTemplate}
              className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              📥 تحميل ملف قالب فارغ (Template)
            </button>
          </div>
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md pointer-events-none">
              {uploading ? "جاري الرفع..." : "اختيار ملف CSV 📤"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">جاري التحميل...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 py-10">لا توجد منتجات مسجلة. قم برفع ملف CSV للبدء.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="p-4 font-bold border-b text-right">الكود (Code)</th>
                  <th className="p-4 font-bold border-b text-right">اسم المنتج (Name)</th>
                  <th className="p-4 font-bold border-b text-right">السعر (Price)</th>
                  <th className="p-4 font-bold border-b text-center">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                    
                    {editingId === product.id ? (
                      <>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={editForm.item_code} 
                            // الفلتر هنا يمنع أي حروف أثناء التعديل
                            onChange={(e) => setEditForm({...editForm, item_code: e.target.value.replace(/\D/g, '')})}
                            className="w-full p-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="الكود"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={editForm.description} 
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full p-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="اسم المنتج"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={editForm.price} 
                            onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                            className="w-full p-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="السعر"
                          />
                        </td>
                        <td className="p-2 text-center flex justify-center gap-2">
                          <button 
                            onClick={() => handleSaveEdit(product.id)}
                            className="text-white bg-green-500 hover:bg-green-600 font-bold text-xs px-3 py-2 rounded-lg transition"
                          >
                            حفظ
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="text-gray-600 bg-gray-200 hover:bg-gray-300 font-bold text-xs px-3 py-2 rounded-lg transition"
                          >
                            إلغاء
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-medium text-gray-600 text-right">{product.item_code || "-"}</td>
                        <td className="p-4 font-bold text-gray-900 text-right">{product.description}</td>
                        <td className="p-4 font-bold text-blue-600 text-right">{product.price.toLocaleString()} EGP</td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(product)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg transition"
                          >
                            تعديل
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg transition"
                          >
                            حذف
                          </button>
                        </td>
                      </>
                    )}
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