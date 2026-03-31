import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ChevronDown, Eye, EyeOff, ArrowUp, ArrowDown, X } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import useDoctors from "@/hooks/useDoctors";
import { useCreateDoctor, useUpdateDoctor, useDeleteDoctor } from "@/hooks/useDoctorsMutations";
import { api } from "@/lib/api";

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
    bio: "", profile_image: "", display_order: 0, is_active: true,
  });
  const [extraFields, setExtraFields] = useState<ExtraFields>({
    languages: "", availability: "", consultation_fee: null, education: "", awards: "",
  });

  const [reordering, setReordering] = useState<string | null>(null);
  const handleReorder = async (id: string, direction: "up" | "down") => {
    setReordering(id);
    try {
      const sorted = [...allDoctors];
      const idx = sorted.findIndex((d: any) => d.id === id);
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) { setReordering(null); return; }
      // Swap display_order using index-based values
      await Promise.all([
        api.put(`/doctors/${sorted[idx].id}`, { display_order: targetIdx }),
        api.put(`/doctors/${sorted[targetIdx].id}`, { display_order: idx }),
      ]);
      doctorsQuery.refetch();
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    } finally { setReordering(null); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", specialization: "", qualification: "", experience_years: 0, bio: "", profile_image: "", display_order: Math.max(0, ...(doctorsQuery.data ?? []).map((d: any) => d.display_order ?? 0)) + 1, is_active: true });
    setExtraFields({ languages: "", availability: "", consultation_fee: null, education: "", awards: "" });
    setExtraOpen(false);
    setOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name: d.name, specialization: d.specialization, qualification: d.qualification || "",
      experience_years: d.experience_years ?? 0, bio: d.bio || "",
      profile_image: d.profile_image || "", display_order: d.display_order,
      is_active: d.is_active !== false,
    });
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
        <Input placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDoctors.map((d: any) => (
          <div key={d.id} className={`rounded-xl border bg-card overflow-hidden card-shadow ${d.is_active !== false ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-center gap-2 px-4 pt-3">
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={reordering === d.id} onClick={() => handleReorder(d.id, "up")}><ArrowUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={reordering === d.id} onClick={() => handleReorder(d.id, "down")}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <span className="text-xs text-muted-foreground">#{d.display_order}</span>
              {d.is_active !== false ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover mt-2" />}
            {!d.profile_image && (
              <div className="aspect-square w-full bg-muted flex items-center justify-center mt-2">
                <span className="text-4xl text-muted-foreground">{d.name?.[0]}</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-display font-semibold text-foreground">{d.name}</h3>
              <p className="text-sm text-primary">{d.specialization}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(d.id, d.name)}><Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {doctorsQuery.isLoading && (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading doctors...</p>
        </div>
      )}
      {!doctorsQuery.isLoading && !filteredDoctors.length && <p className="py-8 text-center text-muted-foreground">{search ? "No doctors match." : "No doctors yet."}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Doctor" : "New Doctor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Photo</Label><div className="mt-1"><ImageUpload value={form.profile_image} onChange={(url) => setForm({ ...form, profile_image: url })} folder="doctors" aspectRatio="1:1" /></div></div>
            <div><Label>Doctor Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Specialization *</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1" /></div>
              <div><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: +e.target.value })} className="mt-1" /></div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> <Label>Visible</Label></div>

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
