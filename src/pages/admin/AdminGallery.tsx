import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import useGallery from "@/hooks/useGallery";
import { useCreateGallery, useUpdateGallery, useDeleteGallery } from "@/hooks/useGalleryMutations";

const AdminGallery = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const galleryQuery = useGallery();
  const createGallery = useCreateGallery();
  const updateGallery = useUpdateGallery();
  const deleteGallery = useDeleteGallery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "", category: "General", display_order: 0 });

  const items = galleryQuery.data ?? [];

  const openNew = () => { setEditing(null); setForm({ title: "", image_url: "", category: "General", display_order: items.length }); setOpen(true); };
  const openEdit = (g: any) => { setEditing(g); setForm({ title: g.title, image_url: g.image_url, category: g.category, display_order: g.display_order }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateGallery.mutateAsync({ id: editing.id, body: form });
        toast({ title: "Image updated" });
      } else {
        await createGallery.mutateAsync(form);
        toast({ title: "Image added" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string, title: string) => {
    const result = await confirm({
      title: "Delete Image",
      description: `Are you sure you want to delete "${title}"?`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await deleteGallery.mutateAsync(id);
      toast({ title: "Image deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((g: any) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Gallery</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search gallery..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((g) => (
          <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border">
            <img src={g.image_url} alt={g.title} className="aspect-video w-full object-cover" />
            <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(g)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="destructive" size="sm" onClick={() => remove(g.id, g.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground">{g.title}</p>
              <p className="text-xs text-muted-foreground">{g.category}</p>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="py-8 text-center text-muted-foreground">No gallery images yet.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Image" : "New Image"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Image</Label><div className="mt-1"><ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="gallery" /></div></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1" /></div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGallery;
