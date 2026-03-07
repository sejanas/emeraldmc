import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/lib/error";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import type { Tables } from "@/integrations/supabase/types";

type Gallery = Tables<"gallery">;

const AdminGallery = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Gallery[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gallery | null>(null);
  const [form, setForm] = useState({ title: "", image_url: "", category: "General", display_order: 0 });

  const load = async () => {
    const { data } = await supabase.from("gallery").select("*").order("display_order");
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ title: "", image_url: "", category: "General", display_order: items.length }); setOpen(true); };
  const openEdit = (g: Gallery) => { setEditing(g); setForm({ title: g.title, image_url: g.image_url, category: g.category, display_order: g.display_order }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) {
        const { error } = await supabase.from("gallery").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gallery").insert(form);
        if (error) throw error;
      }
      toast({ title: editing ? "Image updated" : "Image added" });
      setOpen(false);
      load();
    } catch (err: any) {
      const msg = handleError(err, { feature: 'admin.gallery.save' });
      toast({ title: 'Error saving image', description: msg, variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Image deleted" });
      load();
    } catch (err: any) {
      const msg = handleError(err, { feature: 'admin.gallery.delete' });
      toast({ title: 'Error deleting image', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Gallery</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border">
            <img src={g.image_url} alt={g.title} className="aspect-video w-full object-cover" />
            <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(g)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="destructive" size="sm" onClick={() => remove(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <Button onClick={save} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGallery;
