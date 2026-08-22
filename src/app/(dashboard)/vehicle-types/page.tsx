"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleType {
  id: string;
  name: string;
}

export default function VehicleTypesPage() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchVehicleTypes = async () => {
    const res = await fetch("/api/vehicle-types");
    const data = await res.json();
    setVehicleTypes(data);
  };

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const filtered = vehicleTypes.filter((vt) =>
    vt.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch("/api/vehicle-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setShowForm(false);
    fetchVehicleTypes();
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    await fetch(`/api/vehicle-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    setEditingId(null);
    setEditingName("");
    fetchVehicleTypes();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/vehicle-types/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchVehicleTypes();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการประเภทรถ</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาประเภทรถ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          เพิ่มประเภท
        </button>
      </div>

      {showForm && (
        <div className="flex items-center gap-2 p-4 border rounded-xl bg-card">
          <input
            type="text"
            placeholder="ชื่อประเภทรถ..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="p-2 text-white bg-primary rounded-lg hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setNewName("");
            }}
            className="p-2 text-muted-foreground border rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="border rounded-xl bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">ชื่อประเภทรถ</th>
              <th className="text-left px-4 py-3 font-medium">จำนวนรถ</th>
              <th className="text-right px-4 py-3 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              filtered.map((vt) => (
                <tr key={vt.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {editingId === vt.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(vt.id)}
                        className="w-full px-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      vt.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === vt.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(vt.id)}
                            className="p-1.5 text-white bg-primary rounded-lg hover:bg-primary/90"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName("");
                            }}
                            className="p-1.5 text-muted-foreground border rounded-lg hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(vt.id);
                              setEditingName(vt.name);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(vt.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm p-6 space-y-4 border rounded-xl bg-card">
            <h2 className="text-lg font-bold">ยืนยันการลบ</h2>
            <p className="text-sm text-muted-foreground">
              คุณต้องการลบประเภทรถนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-muted"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-xl hover:bg-destructive/90"
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
