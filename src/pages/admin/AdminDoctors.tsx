import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import type { Tables } from "@/integrations/supabase/types";
import { handleError } from "@/lib/error";
import useDoctors from "@/hooks/useDoctors";
import useSupabaseMutation from "@/hooks/useSupabaseMutation";
import { useQueryClient } from '@tanstack/react-query';
import ErrorBox from "@/components/ErrorBox";

type Doctor = Tables<"doctors">;

const AdminDoctors = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", specialization: "", qualification: "", experience_years: 0,
    bio: "", profile_image: "", display_order: 0,
  });

  const queryClient = useQueryClient();
  const doctorsQuery = useDoctors();

  useEffect(() => {
    if (doctorsQuery.data && editing == null) {
      // noop
    }
  }, [doctorsQuery.data]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", specialization: "", qualification: "", experience_years: 0, bio: "", profile_image: "", display_order: (doctorsQuery.data?.length ?? 0) });
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({ name: d.name, slug: d.slug, specialization: d.specialization, qualification: d.qualification || "", experience_years: d.experience_years ?? 0, bio: d.bio || "", profile_image: d.profile_image || "", display_order: d.display_order });
    setOpen(true);
  };

  const saveMut = useSupabaseMutation(async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...form, slug, qualification: form.qualification || null, bio: form.bio || null, profile_image: form.profile_image || null, experience_years: form.experience_years || null };
    if (editing) {
      const { error } = await supabase.from("doctors").update(payload).eq("id", editing.id);
      if (error) throw error;
      return { action: 'updated' };
    } else {
      const { error } = await supabase.from("doctors").insert(payload);
      if (error) throw error;
      return { action: 'created' };
    }
  }, {
    onSuccess: () => {
      toast({ title: editing ? "Doctor updated" : "Doctor added" });
      setOpen(false);
      queryClient.invalidateQueries(['doctors']);
    },
    onError: (err: any) => {
      const msg = handleError(err, { feature: 'admin.doctors.save' });
      toast({ title: 'Error saving doctor', description: msg, variant: 'destructive' });
    }
  });

  const removeMut = useSupabaseMutation(async (id: string) => {
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) throw error;
    return { id };
  }, {
    onMutate: async (id: string) => {
      await queryClient.cancelQueries(['doctors']);
      const previous = queryClient.getQueryData<Doctor[]>(['doctors']);
      queryClient.setQueryData(['doctors'], (old: any) => (old ?? []).filter((d: Doctor) => d.id !== id));
      return { previous };
    },
    onError: (err: any, id: string, context: any) => {
      queryClient.setQueryData(['doctors'], context.previous);
      const msg = handleError(err, { feature: 'admin.doctors.delete' });
      toast({ title: 'Error deleting doctor', description: msg, variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Doctor deleted' });
      queryClient.invalidateQueries(['doctors']);
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Doctors</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>

      {doctorsQuery.error && <ErrorBox title="Failed to load doctors" message={String(doctorsQuery.error.message ?? doctorsQuery.error)} onRetry={() => doctorsQuery.refetch()} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctorsQuery.data?.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-card overflow-hidden card-shadow">
            {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" />}
            <div className="p-4">
              <h3 className="font-display font-semibold text-foreground">{d.name}</h3>
              <p className="text-sm text-primary">{d.specialization}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => { if (!confirm('Delete this doctor?')) return; removeMut.mutate(d.id); }}><Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete</Button>
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
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1" /></div>
              <div><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: +e.target.value })} className="mt-1" /></div>
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1" /></div>
            <Button onClick={() => saveMut.mutate()} className="w-full" disabled={saveMut.isLoading}>{saveMut.isLoading ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDoctors;
