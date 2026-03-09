import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ChevronDown } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import useDoctors from "@/hooks/useDoctors";
import { useCreateDoctor, useUpdateDoctor, useDeleteDoctor } from "@/hooks/useDoctorsMutations";

interface ExtraFields {
  languages?: string;
  availability?: string;
  consultation_fee?: number | null;
  education?: string;
  awards?: string;
}

const AdminDoctors = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const doctorsQuery = useDoctors();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const deleteDoctor = useDeleteDoctor();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", specialization: "", qualification: "", experience_years: 0,
    bio: "", profile_image: "", display_order: 0,
  });
  const [extraFields, setExtraFields] = useState<ExtraFields>({
    languages: "", availability: "", consultation_fee: null, education: "", awards: "",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", specialization: "", qualification: "", experience_years: 0, bio: "", profile_image: "", display_order: doctorsQuery.data?.length ?? 0 });
    setExtraFields({ languages: "", availability: "", consultation_fee: null, education: "", awards: "" });
    setExtraOpen(false);
    setOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({ name: d.name, specialization: d.specialization, qualification: d.qualification || "", experience_years: d.experience_years ?? 0, bio: d.bio || "", profile_image: d.profile_image || "", display_order: d.display_order });
    const ef = d.extra_fields || {};
    setExtraFields({
      languages: ef.languages || "",
      availability: ef.availability || "",
      consultation_fee: ef.consultation_fee ?? null,
      education: ef.education || "",
      awards: ef.awards || "",
    });
    setExtraOpen(Object.values(ef).some((v) => v));
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleanedExtra: ExtraFields = {};
      if (extraFields.languages?.trim()) cleanedExtra.languages = extraFields.languages.trim();
      if (extraFields.availability?.trim()) cleanedExtra.availability = extraFields.availability.trim();
      if (extraFields.consultation_fee && extraFields.consultation_fee > 0) cleanedExtra.consultation_fee = extraFields.consultation_fee;
      if (extraFields.education?.trim()) cleanedExtra.education = extraFields.education.trim();
      if (extraFields.awards?.trim()) cleanedExtra.awards = extraFields.awards.trim();

      const body = { ...form, extra_fields: cleanedExtra };
      if (editing) {
        await updateDoctor.mutateAsync({ id: editing.id, body });
        toast({ title: "Doctor updated" });
      } else {
        await createDoctor.mutateAsync(body);
        toast({ title: "Doctor added" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    const result = await confirm({
      title: "Delete Doctor",
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await deleteDoctor.mutateAsync(id);
      toast({ title: "Doctor deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const [search, setSearch] = useState("");
  const allDoctors = doctorsQuery.data ?? [];
  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return allDoctors;
    const q = search.toLowerCase();
    return allDoctors.filter((d: any) => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q));
  }, [allDoctors, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Doctors</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDoctors.map((d: any) => (
          <div key={d.id} className="rounded-xl border border-border bg-card overflow-hidden card-shadow">
            {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" />}
            <div className="p-4">
              <h3 className="font-display font-semibold text-foreground">{d.name}</h3>
              <p className="text-sm text-primary">{d.specialization}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>
              {d.extra_fields?.consultation_fee && (
                <p className="text-xs text-muted-foreground">Fee: ₹{d.extra_fields.consultation_fee}</p>
              )}
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(d.id, d.name)}><Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete</Button>
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
            <div><Label>Profile Image</Label><div className="mt-1"><ImageUpload value={form.profile_image} onChange={(url) => setForm({ ...form, profile_image: url })} folder="doctors" aspectRatio="1:1" /></div></div>
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

            {/* Extra Fields Section */}
            <Collapsible open={extraOpen} onOpenChange={setExtraOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between text-muted-foreground">
                  Optional Fields <ChevronDown className={`h-4 w-4 transition-transform ${extraOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div><Label>Languages Spoken</Label><Input value={extraFields.languages} onChange={(e) => setExtraFields({ ...extraFields, languages: e.target.value })} placeholder="e.g. English, Hindi, Telugu" className="mt-1" /></div>
                <div><Label>Availability</Label><Input value={extraFields.availability} onChange={(e) => setExtraFields({ ...extraFields, availability: e.target.value })} placeholder="e.g. Mon-Fri 9AM-5PM" className="mt-1" /></div>
                <div><Label>Consultation Fee (₹)</Label><Input type="number" value={extraFields.consultation_fee ?? ""} onChange={(e) => setExtraFields({ ...extraFields, consultation_fee: e.target.value ? +e.target.value : null })} placeholder="Optional" className="mt-1" /></div>
                <div><Label>Education</Label><Textarea value={extraFields.education} onChange={(e) => setExtraFields({ ...extraFields, education: e.target.value })} placeholder="Educational background" className="mt-1" rows={2} /></div>
                <div><Label>Awards & Recognitions</Label><Textarea value={extraFields.awards} onChange={(e) => setExtraFields({ ...extraFields, awards: e.target.value })} placeholder="Awards, certifications, achievements" className="mt-1" rows={2} /></div>
              </CollapsibleContent>
            </Collapsible>

            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDoctors;
