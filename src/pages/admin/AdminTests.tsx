import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { handleError } from "@/lib/error";
import type { Tables } from "@/integrations/supabase/types";
import useTests from "@/hooks/useTests";
import useCategories from "@/hooks/useCategories";
import useSupabaseMutation from "@/hooks/useSupabaseMutation";
import { useQueryClient } from '@tanstack/react-query';
import ErrorBox from "@/components/ErrorBox";

type Test = Tables<"tests">;
type Category = Tables<"test_categories">;

const AdminTests = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: 0, sample_type: "Blood",
    report_time: "Same Day", category_id: "" as string | null, is_active: true,
    fasting_required: false, display_order: 0,
  });

  const queryClient = useQueryClient();
  const testsQuery = useTests();
  const categoriesQuery = useCategories();

  useEffect(() => {
    if (testsQuery.data && editing == null) {
      // noop
    }
  }, [testsQuery.data]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", price: 0, sample_type: "Blood", report_time: "Same Day", category_id: null, is_active: true, fasting_required: false, display_order: testsQuery.data?.length ?? 0 });
    setOpen(true);
  };

  const openEdit = (t: Test) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, description: t.description || "", price: t.price, sample_type: t.sample_type, report_time: t.report_time, category_id: t.category_id, is_active: t.is_active, fasting_required: t.fasting_required, display_order: t.display_order });
    setOpen(true);
  };

  const saveMut = useSupabaseMutation(async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...form, slug, category_id: form.category_id || null };
    if (editing) {
      const { error } = await supabase.from("tests").update(payload).eq("id", editing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("tests").insert(payload);
      if (error) throw error;
    }
    return {};
  }, {
    onSuccess: () => {
      toast({ title: editing ? "Test updated" : "Test created" });
      setOpen(false);
      queryClient.invalidateQueries(['tests']);
    },
    onError: (err: any) => {
      const msg = handleError(err, { feature: 'admin.tests.save' });
      toast({ title: 'Error saving test', description: msg, variant: 'destructive' });
    }
  });

  const removeMut = useSupabaseMutation(async (id: string) => {
    const { error } = await supabase.from("tests").delete().eq("id", id);
    if (error) throw error;
    return { id };
  }, {
    onMutate: async (id: string) => {
      await queryClient.cancelQueries(['tests']);
      const previous = queryClient.getQueryData<Test[]>(['tests']);
      queryClient.setQueryData(['tests'], (old: any) => (old ?? []).filter((t: Test) => t.id !== id));
      return { previous };
    },
    onError: (err: any, id: string, context: any) => {
      queryClient.setQueryData(['tests'], context.previous);
      const msg = handleError(err, { feature: 'admin.tests.delete' });
      toast({ title: 'Error deleting test', description: msg, variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Test deleted' });
      queryClient.invalidateQueries(['tests']);
    }
  });

  const catName = (id: string | null) => categoriesQuery.data?.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Tests</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>

      {testsQuery.error && <ErrorBox title="Failed to load tests" message={String(testsQuery.error.message ?? testsQuery.error)} onRetry={() => testsQuery.refetch()} />}

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(testsQuery.data ?? []).map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3">{t.display_order}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{catName(t.category_id)}</td>
                <td className="px-4 py-3">₹{t.price}</td>
                <td className="px-4 py-3">{t.is_active ? "✓" : "✗"}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (!confirm('Delete this test?')) return; removeMut.mutate(t.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {testsQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {testsQuery.isLoading === false && (testsQuery.data?.length ?? 0) === 0 && <p className="p-6 text-center text-muted-foreground">No tests yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Test" : "New Test"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="mt-1" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id ?? ""} onValueChange={(v) => setForm({ ...form, category_id: v || null })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(categoriesQuery.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            <Button onClick={() => saveMut.mutate()} className="w-full" disabled={saveMut.isLoading}>{saveMut.isLoading ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTests;
