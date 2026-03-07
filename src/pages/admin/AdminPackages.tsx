import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import usePackages from "@/hooks/usePackages";
import useSupabaseQuery from "@/hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";

const AdminPackages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const packagesQuery = usePackages();
  const allTestsQuery = useSupabaseQuery(["tests", "all"], () => api.get("/tests"));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", original_price: 0,
    discounted_price: null as number | null, is_popular: false, display_order: 0,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", original_price: 0, discounted_price: null, is_popular: false, display_order: packagesQuery.data?.packages.length ?? 0 });
    setSelectedTests([]);
    setOpen(true);
  };

  const openEdit = (pkg: any) => {
    setEditing(pkg);
    setForm({ name: pkg.name, slug: pkg.slug, description: pkg.description || "", original_price: pkg.original_price, discounted_price: pkg.discounted_price, is_popular: pkg.is_popular, display_order: pkg.display_order });
    // Get test IDs for this package from testNames
    setSelectedTests([]);
    setOpen(true);
  };

  const toggleTest = (id: string) => {
    setSelectedTests((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/packages/${editing.id}`, { ...form, test_ids: selectedTests });
        toast({ title: "Package updated" });
      } else {
        await api.post("/packages", { ...form, test_ids: selectedTests });
        toast({ title: "Package created" });
      }
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    try {
      await api.del(`/packages/${id}`);
      toast({ title: "Package deleted" });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const packages = packagesQuery.data?.packages ?? [];
  const testNames = packagesQuery.data?.testNames ?? {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Packages</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Tests</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Popular</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">{p.display_order}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">₹{p.discounted_price ?? p.original_price}</td>
                <td className="px-4 py-3 text-muted-foreground">{(testNames[p.id] ?? []).length} tests</td>
                <td className="px-4 py-3">{p.is_popular ? "⭐" : "—"}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {packagesQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!packagesQuery.isLoading && !packages.length && <p className="p-6 text-center text-muted-foreground">No packages yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Original Price (₹)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: +e.target.value })} className="mt-1" /></div>
              <div><Label>Discounted Price</Label><Input type="number" value={form.discounted_price ?? ""} onChange={(e) => setForm({ ...form, discounted_price: e.target.value ? +e.target.value : null })} className="mt-1" placeholder="Optional" /></div>
            </div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} /> <Label>Popular</Label></div>
            <div>
              <Label className="mb-2 block">Included Tests</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-3 space-y-2">
                {(allTestsQuery.data ?? []).map((t: any) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedTests.includes(t.id)} onCheckedChange={() => toggleTest(t.id)} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
