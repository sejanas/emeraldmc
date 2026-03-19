import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { Plus, Pencil, Trash2, Search, Award, BadgeCheck, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { useCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification } from "@/hooks/useCertifications";
import ImageUpload from "@/components/ImageUpload";
import { reorderItem } from "@/lib/api";

const emptyForm = {
  name: "", slug: "", issuing_authority: "", description: "", image_url: "",
  authority_logo: "", certificate_id: "", valid_till: "", is_verified: false,
  display_order: 0, is_active: true,
};

const AdminCertifications = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const certsQuery = useCertifications();
  const createCert = useCreateCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [reordering, setReordering] = useState<string | null>(null);
  const handleReorder = async (id: string, direction: "up" | "down") => {
    setReordering(id);
    try {
      await reorderItem("certifications", id, direction);
      certsQuery.refetch();
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    } finally { setReordering(null); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: (certsQuery.data ?? []).length });
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name, slug: c.slug, issuing_authority: c.issuing_authority || "",
      description: c.description || "", image_url: c.image_url || "",
      authority_logo: c.authority_logo || "", certificate_id: c.certificate_id || "",
      valid_till: c.valid_till || "", is_verified: c.is_verified ?? false,
      display_order: c.display_order, is_active: c.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, valid_till: form.valid_till || null };
      if (editing) {
        await updateCert.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Certification updated" });
      } else {
        await createCert.mutateAsync(payload);
        toast({ title: "Certification created" });
      }
      setOpen(false);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    const r = await confirm({ title: "Delete Certification", description: `Delete "${name}"?`, confirmLabel: "Delete", variant: "destructive" });
    if (!r.confirmed) return;
    try { await deleteCert.mutateAsync(id); toast({ title: "Deleted" }); }
    catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const certs = certsQuery.data ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return certs;
    const q = search.toLowerCase();
    return certs.filter((c: any) => c.name.toLowerCase().includes(q));
  }, [certs, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Certifications</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c: any) => (
          <div key={c.id} className={`rounded-xl border bg-card p-4 ${c.is_active ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={reordering === c.id} onClick={() => handleReorder(c.id, "up")}><ArrowUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={reordering === c.id} onClick={() => handleReorder(c.id, "down")}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <span className="text-xs text-muted-foreground">#{c.display_order}</span>
              {c.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              {c.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            </div>
            {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-32 object-contain rounded-lg bg-muted mb-3" loading="lazy" />}
            <div className="flex items-start gap-2">
              <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                {c.issuing_authority && <p className="text-xs text-muted-foreground">{c.issuing_authority}</p>}
                {c.certificate_id && <p className="text-xs text-muted-foreground">ID: {c.certificate_id}</p>}
                {c.valid_till && <p className="text-xs text-muted-foreground">Valid till: {c.valid_till}</p>}
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(c.id, c.name)}><Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Delete</Button>
            </div>
          </div>
        ))}
      </div>
      {certsQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
      {!certsQuery.isLoading && !filtered.length && <p className="p-6 text-center text-muted-foreground">No certifications yet.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Certification" : "New Certification"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Certificate Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Issued By</Label><Input value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })} className="mt-1" /></div>
            <div><Label>Certificate Image</Label><div className="mt-1"><ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="certifications" aspectRatio="4:3" /></div></div>
            <div><Label>Authority Logo (URL or Upload)</Label>
              <Input value={form.authority_logo} onChange={(e) => setForm({ ...form, authority_logo: e.target.value })} placeholder="https://... or upload below" className="mt-1 mb-1" />
              <ImageUpload value={form.authority_logo} onChange={(url) => setForm({ ...form, authority_logo: url })} folder="certifications" aspectRatio="free" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Certificate ID</Label><Input value={form.certificate_id} onChange={(e) => setForm({ ...form, certificate_id: e.target.value })} placeholder="Optional" className="mt-1" /></div>
              <div><Label>Valid Till</Label><Input type="date" value={form.valid_till} onChange={(e) => setForm({ ...form, valid_till: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={(v) => setForm({ ...form, is_verified: v })} /><Label>Verified</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Visible</Label></div>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCertifications;
