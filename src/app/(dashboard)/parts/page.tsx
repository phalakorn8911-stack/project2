"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Package,
  Pencil,
  Trash2,
  X,
  Save,
  Minus,
  PlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Part {
  id: string;
  name: string;
  partNumber: string;
  categoryId: string;
  stockQuantity: number;
  minimumQuantity: number;
  unitMeasure: string;
  unitPrice: number;
  vendorId?: string;
}

interface Category {
  id: string;
  name: string;
}

const CATEGORIES: Category[] = [
  { id: "1", name: "เครื่องยนต์" },
  { id: "2", name: "ระบบเกียร์" },
  { id: "3", name: "ระบบเบรก" },
  { id: "4", name: "ระบบไฟฟ้า" },
  { id: "5", name: "ระบบระบายความร้อน" },
  { id: "6", name: "ระบบเชื้อเพลิง" },
  { id: "7", name: "ระบบกันสะเทือน" },
  { id: "8", name: "ตัวถังและอุปกรณ์ตกแต่ง" },
  { id: "9", name: "ของเหลวและสารหล่อลื่น" },
  { id: "10", name: "อื่นๆ" },
];

const STATUS_CONFIG = {
  critical: { label: "วิกฤติ", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  low: { label: "ใกล้หมด", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  normal: { label: "ปกติ", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

function getStockStatus(stock: number, min: number) {
  if (stock <= 0) return STATUS_CONFIG.critical;
  if (stock <= min) return STATUS_CONFIG.low;
  return STATUS_CONFIG.normal;
}

const defaultForm: Omit<Part, "id"> = {
  name: "",
  partNumber: "",
  categoryId: "",
  stockQuantity: 0,
  minimumQuantity: 0,
  unitMeasure: "ชิ้น",
  unitPrice: 0,
  vendorId: "",
};

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [form, setForm] = useState<Omit<Part, "id">>(defaultForm);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState<string>("1");
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        setParts(Array.isArray(data) ? data : data.parts ?? []);
      }
    } catch {
      console.error("Failed to fetch parts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (id: string) =>
    CATEGORIES.find((c) => c.id === id)?.name ?? "ไม่ระบุ";

  const openAdd = () => {
    setEditingPart(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (part: Part) => {
    setEditingPart(part);
    setForm({
      name: part.name,
      partNumber: part.partNumber,
      categoryId: part.categoryId,
      stockQuantity: part.stockQuantity,
      minimumQuantity: part.minimumQuantity,
      unitMeasure: part.unitMeasure,
      unitPrice: part.unitPrice,
      vendorId: part.vendorId ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.partNumber.trim()) return;

    try {
      if (editingPart) {
        await fetch(`/api/parts/${editingPart.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      setEditingPart(null);
      fetchParts();
    } catch {
      console.error("Failed to save part");
    }
  };

  const handleStockAdjust = async (partId: string, delta: number) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return;

    const qty = parseInt(adjustValue, 10);
    if (isNaN(qty) || qty <= 0) return;

    const newStock = Math.max(0, part.stockQuantity + delta * qty);

    try {
      await fetch(`/api/parts/${partId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      setAdjustingId(null);
      setAdjustValue("1");
      fetchParts();
    } catch {
      console.error("Failed to adjust stock");
    }
  };

  const handleDelete = async (partId: string) => {
    try {
      await fetch(`/api/parts/${partId}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchParts();
    } catch {
      console.error("Failed to delete part");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(val);

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">คลังอะไหล่</h1>
            <p className="text-sm text-muted-foreground">
              จัดการอะไหล่และอุปกรณ์ทั้งหมด ({parts.length} รายการ)
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          เพิ่มอะไหล่
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ค้นหาอะไหล่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredParts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">ไม่พบอะไหล่</p>
          <p className="text-sm">
            {search ? "ลองค้นหาด้วยคำอื่น" : "เริ่มเพิ่มอะไหล่แรกของคุณ"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParts.map((part) => {
            const status = getStockStatus(part.stockQuantity, part.minimumQuantity);
            const category = getCategoryName(part.categoryId);
            const isAdjusting = adjustingId === part.id;

            return (
              <div
                key={part.id}
                className="rounded-xl bg-card border border-border p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{part.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      รหัส: {part.partNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ml-2",
                      status.color
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">สต็อก</span>
                    <span className="font-semibold">
                      {part.stockQuantity} {part.unitMeasure}
                    </span>
                  </div>

                  {isAdjusting ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={adjustValue}
                        onChange={(e) => setAdjustValue(e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-border rounded-lg bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleStockAdjust(part.id, -1)}
                        className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="ลดสต็อก"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleStockAdjust(part.id, 1)}
                        className="p-1 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                        title="เพิ่มสต็อก"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setAdjustingId(null);
                          setAdjustValue("1");
                        }}
                        className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        title="ยกเลิก"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdjustingId(part.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      ปรับสต็อก
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ราคา/หน่วย</span>
                  <span className="font-semibold">{formatCurrency(part.unitPrice)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">สต็อกขั้นต่ำ</span>
                  <span className="text-muted-foreground">
                    {part.minimumQuantity} {part.unitMeasure}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => openEdit(part)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => setDeleteTarget(part)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {editingPart ? "แก้ไขอะไหล่" : "เพิ่มอะไหล่ใหม่"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPart(null);
                }}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">ชื่ออะไหล่ *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="ระบุชื่ออะไหล่"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">รหัสอะไหล่ *</label>
                <input
                  type="text"
                  value={form.partNumber}
                  onChange={(e) => setForm((f) => ({ ...f, partNumber: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="ระบุรหัสอะไหล่"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">หมวดหมู่</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">สต็อกปัจจุบัน</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stockQuantity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stockQuantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">สต็อกขั้นต่ำ</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minimumQuantity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minimumQuantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">หน่วยนับ</label>
                  <input
                    type="text"
                    value={form.unitMeasure}
                    onChange={(e) => setForm((f) => ({ ...f, unitMeasure: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="ชิ้น, ลิตร, ขวด..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">ราคา/หน่วย (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        unitPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingPart(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim() || !form.partNumber.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {editingPart ? "บันทึกการแก้ไข" : "เพิ่มอะไหล่"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
              <p className="text-sm text-muted-foreground">
                ต้องการลบอะไหล่ <span className="font-medium text-foreground">{deleteTarget.name}</span>{" "}
                ออกจากรายการหรือไม่?
              </p>
              <p className="text-xs text-muted-foreground">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 border-t border-border">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
