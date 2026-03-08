import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import useCategories from "@/hooks/useCategories";
import useTests from "@/hooks/useTests";
import { useCreateTest, useUpdateTest, useDeleteTest } from "@/hooks/useTests";

const AdminTests = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();
  const categoriesQuery = useCategories();
  const testsQuery = useTests({ active: false });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: 0, original_price: 0, sample_type: "Blood",
    report_time: "Same Day", category_id: "" as string | null, is_active: true,
    fasting_required: false, display_order: 0,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", price: 0, original_price: 0, sample_type: "Blood", report_time: "Same Day", category_id: null, is_active: true, fasting_required: false, display_order: testsQuery.data?.length ?? 0 });
    setSelectedCategoryIds([]);
    setOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, description: t.description || "", price: t.price, original_price: t.original_price || 0, sample_type: t.sample_type, report_time: t.report_time, category_id: t.category_id, is_active: t.is_active, fasting_required: t.fasting_required, display_order: t.display_order });
    setSelectedCategoryIds((t.categories ?? []).map((c: any) => c.id));
    setOpen(true);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, category_ids: selectedCategoryIds };
      if (editing) {
        await updateTest.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Test updated" });
      } else {
        await createTest.mutateAsync(payload);
        toast({ title: "Test created" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    const result = await confirm({
      title: "Delete Test",
      description: `Are you sure you want to delete "${name}"?`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await deleteTest.mutateAsync(id);
      toast({ title: "Test deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getCatNames = (t: any) =>
    (t.categories ?? []).map((c: any) => c.name).join(", ") || "—";

  const allTests = testsQuery.data ?? [];
  const filteredTests = useMemo(() => {
    if (!search.trim()) return allTests;
    const q = search.toLowerCase();
    return allTests.filter((t: any) =>
      t.name.toLowerCase().includes(q) ||
      (t.categories ?? []).some((c: any) => c.name.toLowerCase().includes(q))
    );
  }, [allTests, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Tests</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Categories</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">MRP</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(testsQuery.data ?? []).map((t: any) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3">{t.display_order}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{getCatNames(t)}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.original_price ? `₹${t.original_price}` : '—'}</td>
                <td className="px-4 py-3">₹{t.price}</td>
                <td className="px-4 py-3">{t.is_active ? "✓" : "✗"}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id, t.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {testsQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!testsQuery.isLoading && !(testsQuery.data?.length) && <p className="p-6 text-center text-muted-foreground">No tests yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Test" : "New Test"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>MRP (₹)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: +e.target.value })} className="mt-1" /></div>
              <div><Label>Selling Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="mt-1" /></div>
            </div>
            <div>
              <Label>Categories</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-border p-3">
                {(categoriesQuery.data ?? []).map((c: any) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedCategoryIds.includes(c.id)}
                      onCheckedChange={() => toggleCategory(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Sample Type</Label><Input value={form.sample_type} onChange={(e) => setForm({ ...form, sample_type: e.target.value })} className="mt-1" /></div>
              <div><Label>Report Time</Label><Input value={form.report_time} onChange={(e) => setForm({ ...form, report_time: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> <Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.fasting_required} onCheckedChange={(v) => setForm({ ...form, fasting_required: v })} /> <Label>Fasting Required</Label></div>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTests;
