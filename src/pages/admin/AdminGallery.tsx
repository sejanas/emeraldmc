import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Images, SlidersHorizontal } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import ImageEditor from "@/components/ImageEditor";
import useGallery from "@/hooks/useGallery";
import { useCreateGallery, useUpdateGallery, useDeleteGallery } from "@/hooks/useGalleryMutations";

const CATEGORIES = ["General", "Lab", "Equipment", "Events", "Team", "Facility", "Patients"];

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
  const [form, setForm] = useState({ title: "", description: "", image_url: "", category: "General", display_order: 0 });

  // Image editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorItem, setEditorItem] = useState<any>(null);

  const items = galleryQuery.data ?? [];

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", image_url: "", category: "General", display_order: items.length }); setOpen(true); };
  const openEdit = (g: any) => { setEditing(g); setForm({ title: g.title, description: g.description || "", image_url: g.image_url, category: g.category, display_order: g.display_order }); setOpen(true); };

  const openEditor = (g: any) => {
    setEditorItem(g);
    setEditorOpen(true);
  };

  const handleEditorSave = async (newUrl: string) => {
    if (!editorItem) return;
    try {
      await updateGallery.mutateAsync({ id: editorItem.id, body: { image_url: newUrl } });
      toast({ title: "Image updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const save = async () => {
    if (!form.image_url) { toast({ title: "Please upload an image", variant: "destructive" }); return; }
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
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
  const [filterCat, setFilterCat] = useState("All");
  const filteredItems = useMemo(() => {
    let result = items;
    if (filterCat !== "All") result = result.filter((g: any) => g.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g: any) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
    }
    return result;
  }, [items, search, filterCat]);

  const existingCats = ["All", ...Array.from(new Set(items.map((i: any) => i.category as string)))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gallery</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} images</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add Image</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search gallery..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {existingCats.map((c: string) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${filterCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((g: any) => (
          <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-video overflow-hidden">
              <img src={g.image_url} alt={g.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(g)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openEditor(g)}>
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Adjust
              </Button>
              <Button variant="destructive" size="sm" onClick={() => remove(g.id, g.title)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground truncate">{g.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-primary font-medium">{g.category}</span>
                <span className="text-xs text-muted-foreground">#{g.display_order}</span>
              </div>
              {g.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {!filteredItems.length && (
        <div className="py-16 text-center">
          <Images className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">{search || filterCat !== "All" ? "No images match your filter." : "No gallery images yet. Add your first image!"}</p>
        </div>
      )}

      {/* Add/Edit form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Gallery Image" : "Add Gallery Image"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Image <span className="text-destructive">*</span></Label>
              <div className="mt-1">
                <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="gallery" aspectRatio="16:9" />
              </div>
            </div>
            <div>
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="e.g. Our Modern Laboratory" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" placeholder="Optional description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" />
              </div>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Editor dialog */}
      {editorItem && (
        <ImageEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          imageUrl={editorItem.image_url}
          onSave={handleEditorSave}
          folder="gallery"
        />
      )}
    </div>
  );
};

export default AdminGallery;
