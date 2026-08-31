"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface Unit {
  id: string;
  name: string;
  description: string;
  vehicleCount: number;
  userCount: number;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/units");
      const data = await res.json();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", description: "" });
        setShowForm(false);
        fetchUnits();
      }
    } catch (err) {
      console.error("Failed to create unit", err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim()) return;
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        fetchUnits();
      }
    } catch (err) {
      console.error("Failed to update unit", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchUnits();
      }
    } catch (err) {
      console.error("Failed to delete unit", err);
    }
  };

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setEditForm({ name: unit.name, description: unit.description });
  };

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-card-foreground">
          จัดการหน่วยงาน
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setForm({ name: "", description: "" });
          }}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Plus size={16} />
          เพิ่มหน่วยงาน
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="ค้นหาหน่วยงาน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        />
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium text-card-foreground">
            เพิ่มหน่วยงานใหม่
          </h2>
          <input
            type="text"
            placeholder="ชื่อหน่วยงาน *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={cn(
              "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          />
          <textarea
            placeholder="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={cn(
              "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            )}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className={cn(
                "flex items-center gap-1 rounded-xl px-4 py-2 text-sm",
                "border border-border hover:bg-muted"
              )}
            >
              <X size={14} />
              ยกเลิก
            </button>
            <button
              onClick={handleCreate}
              className={cn(
                "flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Save size={14} />
              บันทึก
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-card-foreground">
                ชื่อหน่วยงาน
              </th>
              <th className="px-4 py-3 text-left font-medium text-card-foreground">
                รายละเอียด
              </th>
              <th className="px-4 py-3 text-center font-medium text-card-foreground">
                จำนวนรถ
              </th>
              <th className="px-4 py-3 text-center font-medium text-card-foreground">
                จำนวนคน
              </th>
              <th className="px-4 py-3 text-center font-medium text-card-foreground">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  กำลังโหลด...
                </td>
              </tr>
            ) : filteredUnits.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลหน่วยงาน
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit) => (
                <tr key={unit.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-card-foreground">
                    {editingId === unit.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className={cn(
                          "w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50"
                        )}
                      />
                    ) : (
                      unit.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {editingId === unit.id ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className={cn(
                          "w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        )}
                      />
                    ) : (
                      unit.description || "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-card-foreground">
                    {unit.vehicleCount}
                  </td>
                  <td className="px-4 py-3 text-center text-card-foreground">
                    {unit.userCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === unit.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleUpdate(unit.id)}
                          className={cn(
                            "rounded-xl p-2 hover:bg-muted",
                            "text-green-600 dark:text-green-400"
                          )}
                          title="บันทึก"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
                          title="ยกเลิก"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : deleteConfirmId === unit.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          ยืนยันลบ?
                        </span>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className={cn(
                            "rounded-xl px-2 py-1 text-xs font-medium",
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          )}
                        >
                          ลบ
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className={cn(
                            "rounded-xl px-2 py-1 text-xs",
                            "border border-border hover:bg-muted"
                          )}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(unit)}
                          className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground"
                          title="แก้ไข"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(unit.id)}
                          className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
