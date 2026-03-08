import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import useDoctors from "@/hooks/useDoctors";
import { useCreateDoctor, useUpdateDoctor, useDeleteDoctor } from "@/hooks/useDoctorsMutations";

const AdminDoctors = () => {
  const { toast } = useToast();
  const doctorsQuery = useDoctors();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const deleteDoctor = useDeleteDoctor();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", specialization: "", qualification: "", experience_years: 0,
    bio: "", profile_image: "", display_order: 0,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", specialization: "", qualification: "", experience_years: 0, bio: "", profile_image: "", display_order: doctorsQuery.data?.length ?? 0 });
    setOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({ name: d.name, specialization: d.specialization, qualification: d.qualification || "", experience_years: d.experience_years ?? 0, bio: d.bio || "", profile_image: d.profile_image || "", display_order: d.display_order });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateDoctor.mutateAsync({ id: editing.id, body: form });
        toast({ title: "Doctor updated" });
      } else {
        await createDoctor.mutateAsync(form);
        toast({ title: "Doctor added" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    try {
      await deleteDoctor.mutateAsync(id);
      toast({ title: "Doctor deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Doctors</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(doctorsQuery.data ?? []).map((d: any) => (
          <div key={d.id} className="rounded-xl border border-border bg-card overflow-hidden card-shadow">
            {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" />}
            <div className="p-4">
              <h3 className="font-display font-semibold text-foreground">{d.name}</h3>
              <p className="text-sm text-primary">{d.specialization}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(d.id)}><Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {doctorsQuery.isLoading && <p className="py-8 text-center text-muted-foreground">Loading...</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Doctor" : "New Doctor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Profile Image</Label><div className="mt-1"><ImageUpload value={form.profile_image} onChange={(url) => setForm({ ...form, profile_image: url })} folder="doctors" /></div></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1" /></div>
              <div><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: +e.target.value })} className="mt-1" /></div>
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDoctors;
