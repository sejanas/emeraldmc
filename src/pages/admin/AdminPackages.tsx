import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, GripVertical } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import usePackages, { useCreatePackage, useUpdatePackage, useDeletePackage } from "@/hooks/usePackages";
import useTests from "@/hooks/useTests";

const AdminPackages = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const packagesQuery = usePackages();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();
  const allTestsQuery = useTests({ active: false });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [featuredTests, setFeaturedTests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", instructions: "",
    original_price: 0, discounted_price: null as number | null,
    savings_override: null as number | null,
    is_popular: false, display_order: 0,
    show_test_count: true, is_active: true,
  });

  const autoSavings = form.discounted_price && form.discounted_price < form.original_price
    ? form.original_price - form.discounted_price : 0;

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "", slug: "", description: "", instructions: "",
      original_price: 0, discounted_price: null,
      savings_override: null, is_popular: false,
      display_order: packagesQuery.data?.packages.length ?? 0,
      show_test_count: true, is_active: true,
    });
    setSelectedTests([]);
    setFeaturedTests([]);
    setOpen(true);
  };

  const openEdit = (pkg: any) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, slug: pkg.slug, description: pkg.description || "",
      instructions: pkg.instructions || "",
      original_price: pkg.original_price, discounted_price: pkg.discounted_price,
      savings_override: pkg.savings_override ?? null,
      is_popular: pkg.is_popular, display_order: pkg.display_order,
      show_test_count: pkg.show_test_count ?? true,
      is_active: pkg.is_active !== false,
    });
    const pkgTestIds = packagesQuery.data?.testIds?.[pkg.id] ?? [];
    setSelectedTests(pkgTestIds);
    setFeaturedTests(pkg.featured_test_ids ?? []);
    setOpen(true);
  };

  const toggleTest = (id: string) => {
    setSelectedTests((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Remove from featured if deselected
      if (!next.includes(id)) {
        setFeaturedTests((f) => f.filter((x) => x !== id));
      }
      return next;
    });
  };

  const toggleFeatured = (id: string) => {
    setFeaturedTests((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) { toast({ title: "Max 5 featured tests", variant: "destructive" }); return prev; }
      return [...prev, id];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        test_ids: selectedTests,
        featured_test_ids: featuredTests,
        discounted_price: form.discounted_price || null,
        savings_override: form.savings_override || null,
      };
      if (editing) {
        await updatePackage.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Package updated" });
      } else {
        await createPackage.mutateAsync(payload);
        toast({ title: "Package created" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    const result = await confirm({
      title: "Delete Package",
      description: `Are you sure you want to delete "${name}"?`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await deletePackage.mutateAsync(id);
      toast({ title: "Package deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const packages = packagesQuery.data?.packages ?? [];
  const testNames = packagesQuery.data?.testNames ?? {};
  const [search, setSearch] = useState("");
  const filteredPackages = useMemo(() => {
    if (!search.trim()) return packages;
    const q = search.toLowerCase();
    return packages.filter((p: any) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
  }, [packages, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Packages</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-2 py-3 w-10"></th>
              <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">MRP</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Tests</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Popular</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Visibility</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.map((p: any) => (
              <tr key={p.id} className={`border-t border-border ${p.is_active === false ? "opacity-50" : ""}`}>
                <td className="px-2 py-3"><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></td>
                <td className="px-4 py-3">{p.display_order}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">₹{p.original_price}</td>
                <td className="px-4 py-3">₹{p.discounted_price ?? p.original_price}</td>
                <td className="px-4 py-3 text-muted-foreground">{(testNames[p.id] ?? []).length} tests</td>
                <td className="px-4 py-3">{p.is_popular ? "⭐" : "—"}</td>
                <td className="px-4 py-3">{p.is_active !== false ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id, p.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {packagesQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!packagesQuery.isLoading && !filteredPackages.length && <p className="p-6 text-center text-muted-foreground">{search ? "No packages match your search." : "No packages yet."}</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Package Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Description (3 lines max on card)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} /></div>
            <div><Label>Instructions (preparation/fasting)</Label><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="mt-1" rows={4} placeholder="E.g. 12 hours fasting required..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>MRP (₹)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: +e.target.value })} className="mt-1" /></div>
              <div><Label>Price (₹)</Label><Input type="number" value={form.discounted_price ?? ""} onChange={(e) => setForm({ ...form, discounted_price: e.target.value ? +e.target.value : null })} className="mt-1" placeholder="Optional" /></div>
            </div>
            {autoSavings > 0 && (
              <p className="text-xs text-muted-foreground">Auto savings: ₹{autoSavings}</p>
            )}
            <div><Label>Savings Override (₹)</Label><Input type="number" value={form.savings_override ?? ""} onChange={(e) => setForm({ ...form, savings_override: e.target.value ? +e.target.value : null })} className="mt-1" placeholder="Leave empty for auto" /></div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2"><Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} /> <Label>Popular</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.show_test_count} onCheckedChange={(v) => setForm({ ...form, show_test_count: v })} /> <Label>Show Test Count</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> <Label>Visible</Label></div>
            </div>
            <div>
              <Label className="mb-2 block">Included Tests</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-3 space-y-2">
                {(allTestsQuery.data ?? []).map((t: any) => {
                  const isSelected = selectedTests.includes(t.id);
                  const isFeatured = featuredTests.includes(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleTest(t.id)} />
                      <span className={`flex-1 cursor-pointer ${isSelected ? "" : "text-muted-foreground"}`} onClick={() => toggleTest(t.id)}>
                        {t.name}
                      </span>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={() => toggleFeatured(t.id)}
                          className={`text-xs px-2 py-0.5 rounded-full border ${isFeatured ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:border-primary"}`}
                        >
                          {isFeatured ? "★ Featured" : "Feature"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Select up to 5 featured tests to highlight on the card.</p>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
