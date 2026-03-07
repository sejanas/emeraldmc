import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/lib/error";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import useCategories from "@/hooks/useCategories";
import useSupabaseMutation from "@/hooks/useSupabaseMutation";
import { useQueryClient } from '@tanstack/react-query';

type Category = Tables<"test_categories">;

const AdminCategories = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", display_order: 0 });

  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();

  useEffect(() => {
    if (categoriesQuery.data) {
      // keep local copy only for ordering in dialog; otherwise read from query
    }
  }, [categoriesQuery.data]);

  const openNew = () => { setEditing(null); setForm({ name: "", slug: "", display_order: (categoriesQuery.data?.length ?? 0) }); setOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, slug: c.slug, display_order: c.display_order }); setOpen(true); };
  const saveMut = useSupabaseMutation(async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (editing) {
      const { error } = await supabase.from("test_categories").update({ name: form.name, slug, display_order: form.display_order }).eq("id", editing.id);
      if (error) throw error;
      return { action: 'updated' };
    } else {
      const { error } = await supabase.from("test_categories").insert({ name: form.name, slug, display_order: form.display_order });
      if (error) throw error;
      return { action: 'created' };
    }
  }, {
    onSuccess: () => {
      toast({ title: editing ? "Category updated" : "Category created" });
      setOpen(false);
      queryClient.invalidateQueries(['test_categories']);
    },
    onError: (err: any) => {
      const msg = handleError(err, { feature: 'admin.categories.save' });
      toast({ title: 'Error saving category', description: msg, variant: 'destructive' });
    }
  });

  const removeMut = useSupabaseMutation(async (id: string) => {
    const { error } = await supabase.from("test_categories").delete().eq("id", id);
    if (error) throw error;
    return { action: 'deleted' };
  }, {
    onSuccess: () => {
      toast({ title: 'Category deleted' });
      queryClient.invalidateQueries(['test_categories']);
    },
    onError: (err: any) => {
      const msg = handleError(err, { feature: 'admin.categories.delete' });
      toast({ title: 'Error deleting category', description: msg, variant: 'destructive' });
    }
  });

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
                  <Button variant="ghost" size="icon" onClick={() => { if (!confirm('Delete this category?')) return; removeMut.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categoriesQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {categoriesQuery.isLoading === false && (categoriesQuery.data?.length ?? 0) === 0 && <p className="p-6 text-center text-muted-foreground">No categories yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <Button onClick={() => saveMut.mutate()} className="w-full" disabled={saveMut.isLoading}>{saveMut.isLoading ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
