import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import useCategories from "@/hooks/useCategories";
import { useQueryClient } from "@tanstack/react-query";

const AdminCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", display_order: 0 });

  const openNew = () => { setEditing(null); setForm({ name: "", slug: "", display_order: categoriesQuery.data?.length ?? 0 }); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug, display_order: c.display_order }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast({ title: "Category updated" });
      } else {
        await api.post("/categories", form);
        toast({ title: "Category created" });
      }
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["test_categories"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.del(`/categories/${id}`);
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: ["test_categories"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Test Categories</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(categoriesQuery.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">{c.display_order}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categoriesQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!categoriesQuery.isLoading && !(categoriesQuery.data?.length) && <p className="p-6 text-center text-muted-foreground">No categories yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
