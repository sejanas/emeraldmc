import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pkg = Tables<"packages">;
type Test = Tables<"tests">;

const AdminPackages = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Pkg[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [pkgTests, setPkgTests] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", original_price: 0,
    discounted_price: null as number | null, is_popular: false, display_order: 0,
  });

  const load = async () => {
    const [{ data: p }, { data: t }, { data: pt }] = await Promise.all([
      supabase.from("packages").select("*").order("display_order"),
      supabase.from("tests").select("*").order("name"),
      supabase.from("package_tests").select("*"),
    ]);
    if (p) setItems(p);
    if (t) setTests(t);
    if (pt) {
      const map: Record<string, string[]> = {};
      pt.forEach((r) => { (map[r.package_id] ??= []).push(r.test_id); });
      setPkgTests(map);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", original_price: 0, discounted_price: null, is_popular: false, display_order: items.length });
    setSelectedTests([]);
    setOpen(true);
  };

  const openEdit = (pkg: Pkg) => {
    setEditing(pkg);
    setForm({ name: pkg.name, slug: pkg.slug, description: pkg.description || "", original_price: pkg.original_price, discounted_price: pkg.discounted_price, is_popular: pkg.is_popular, display_order: pkg.display_order });
    setSelectedTests(pkgTests[pkg.id] ?? []);
    setOpen(true);
  };

  const toggleTest = (id: string) => {
    setSelectedTests((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const save = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let pkgId = editing?.id;
    if (editing) {
      await supabase.from("packages").update({ ...form, slug }).eq("id", editing.id);
    } else {
      const { data } = await supabase.from("packages").insert({ ...form, slug }).select("id").single();
      pkgId = data?.id;
    }
    if (pkgId) {
      await supabase.from("package_tests").delete().eq("package_id", pkgId);
      if (selectedTests.length) {
        await supabase.from("package_tests").insert(selectedTests.map((t) => ({ package_id: pkgId!, test_id: t })));
      }
    }
    toast({ title: editing ? "Package updated" : "Package created" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    await supabase.from("package_tests").delete().eq("package_id", id);
    await supabase.from("packages").delete().eq("id", id);
    toast({ title: "Package deleted" });
    load();
  };

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
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">{p.display_order}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">₹{p.discounted_price ?? p.original_price}</td>
                <td className="px-4 py-3 text-muted-foreground">{(pkgTests[p.id] ?? []).length} tests</td>
                <td className="px-4 py-3">{p.is_popular ? "⭐" : "—"}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-muted-foreground">No packages yet.</p>}
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
                {tests.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedTests.includes(t.id)} onCheckedChange={() => toggleTest(t.id)} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={save} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
