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
  ListPlus,
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

const STATUS_CONFIG = {
  critical: { label: "วิกฤติ", color: "text-destructive bg-destructive/10 border-destructive/30" },
  low: { label: "ใกล้หมด", color: "text-warning bg-warning/10 border-warning/30" },
  normal: { label: "ปกติ", color: "text-success bg-success/10 border-success/30" },
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
  const [batchMode, setBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<Omit<Part, "id">[]>([{ ...defaultForm }]);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.parts ?? [];
        setParts(list.map((p: any) => ({
          id: p.id,
          name: p.name ?? "",
          partNumber: p.partNumber ?? "",
          categoryId: p.categoryId ?? "",
          stockQuantity: p.stockQuantity ?? 0,
          minimumQuantity: p.minimumQuantity ?? 0,
          unitMeasure: p.unitMeasure ?? "ชิ้น",
          unitPrice: p.unitPrice ?? 0,
          vendorId: p.vendorId ?? "",
        })));
      }
    } catch {
      console.error("Failed to fetch parts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
    fetch("/api/part-categories").then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "ไม่ระบุ";

  const openAdd = () => {
    setEditingPart(null);
    setForm(defaultForm);
    setBatchMode(false);
    setBatchItems([{ ...defaultForm }]);
    setShowForm(true);
  };

  const openBatchAdd = () => {
    setEditingPart(null);
    setForm(defaultForm);
    setBatchMode(true);
    setBatchItems([{ ...defaultForm }]);
    setShowForm(true);
  };

  const addBatchRow = () => {
    if (batchItems.length < 20) {
      setBatchItems([...batchItems, { ...defaultForm }]);
    }
  };

  const removeBatchRow = (index: number) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter((_, i) => i !== index));
    }
  };

  const updateBatchItem = (index: number, field: keyof Omit<Part, "id">, value: any) => {
    const updated = [...batchItems];
    updated[index] = { ...updated[index], [field]: value };
    setBatchItems(updated);
  };

  const handleBatchSave = async () => {
    const validItems = batchItems.filter(
      (item) => item.name?.trim() && item.partNumber?.trim()
    );
    if (validItems.length === 0) return;

    setSaving(true);
    try {
      await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      });
      setShowForm(false);
      setBatchMode(false);
      setBatchItems([{ ...defaultForm }]);
      fetchParts();
    } catch {
      console.error("Failed to batch save parts");
    } finally {
      setSaving(false);
    }
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
    if (!form.name?.trim() || !form.partNumber?.trim()) return;

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

    try {
      await fetch(`/api/parts/${partId}/stock-adjust`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: delta * qty }),
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
        <div className="flex items-center gap-2">
          <button
            onClick={openBatchAdd}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-card-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <ListPlus className="h-4 w-4" />
            เพิ่มหลายรายการ
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            เพิ่มอะไหล่
          </button>
        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredParts.map((part) => {
            const status = getStockStatus(part.stockQuantity, part.minimumQuantity);
            const category = getCategoryName(part.categoryId);
            const isAdjusting = adjustingId === part.id;

            return (
              <div
                key={part.id}
                className="rounded-lg bg-card border border-border p-3 space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{part.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {part.partNumber}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
                      status.color
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
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
                      className="w-12 px-1 py-0.5 text-xs border border-border rounded bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleStockAdjust(part.id, -1)}
                      className="p-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="ลดสต็อก"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleStockAdjust(part.id, 1)}
                      className="p-0.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                      title="เพิ่มสต็อก"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setAdjustingId(null);
                        setAdjustValue("1");
                      }}
                      className="p-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                      title="ยกเลิก"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdjustingId(part.id)}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
                  >
                    <Filter className="h-3 w-3" />
                    ปรับ
                  </button>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ราคา</span>
                  <span className="font-medium">{formatCurrency(part.unitPrice)}</span>
                </div>

                <div className="flex items-center gap-1 pt-1.5 border-t border-border">
                  <button
                    onClick={() => openEdit(part)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(part)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {batchMode
                  ? `เพิ่มอะไหล่หลายรายการ (${batchItems.length}/20)`
                  : editingPart
                    ? "แก้ไขอะไหล่"
                    : "เพิ่มอะไหล่ใหม่"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPart(null);
                  setBatchMode(false);
                }}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!batchMode ? (
                <>
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
                      {categories.map((cat) => (
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
                </>
              ) : (
                <div className="space-y-4">
                  {batchItems.map((item, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">รายการที่ {idx + 1}</span>
                        {batchItems.length > 1 && (
                          <button
                            onClick={() => removeBatchRow(idx)}
                            className="p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">ชื่ออะไหล่ *</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateBatchItem(idx, "name", e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="ระบุชื่ออะไหล่"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">รหัสอะไหล่ *</label>
                          <input
                            type="text"
                            value={item.partNumber}
                            onChange={(e) => updateBatchItem(idx, "partNumber", e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="ระบุรหัสอะไหล่"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">หมวดหมู่</label>
                          <select
                            value={item.categoryId}
                            onChange={(e) => updateBatchItem(idx, "categoryId", e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="">เลือกหมวดหมู่</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">สต็อกปัจจุบัน</label>
                          <input
                            type="number"
                            min={0}
                            value={item.stockQuantity}
                            onChange={(e) =>
                              updateBatchItem(idx, "stockQuantity", Math.max(0, parseInt(e.target.value, 10) || 0))
                            }
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">สต็อกขั้นต่ำ</label>
                          <input
                            type="number"
                            min={0}
                            value={item.minimumQuantity}
                            onChange={(e) =>
                              updateBatchItem(idx, "minimumQuantity", Math.max(0, parseInt(e.target.value, 10) || 0))
                            }
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">หน่วยนับ</label>
                          <input
                            type="text"
                            value={item.unitMeasure}
                            onChange={(e) => updateBatchItem(idx, "unitMeasure", e.target.value)}
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
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateBatchItem(idx, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {batchItems.length < 20 && (
                    <button
                      onClick={addBatchRow}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      เพิ่มรายการ (สูงสุด 20)
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingPart(null);
                    setBatchMode(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={batchMode ? handleBatchSave : handleSave}
                  disabled={
                    batchMode
                      ? batchItems.filter((i) => i.name?.trim() && i.partNumber?.trim()).length === 0
                      : !form.name?.trim() || !form.partNumber?.trim()
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {batchMode ? "บันทึกรายการทั้งหมด" : editingPart ? "บันทึกการแก้ไข" : "เพิ่มอะไหล่"}
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
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
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
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
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
