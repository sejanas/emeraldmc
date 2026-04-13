import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useFaqs, useFaqsMutations } from "@/hooks/useFaqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { useConfirm } from "@/components/ConfirmDialog";
import ErrorBox from "@/components/ErrorBox";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";

const empty = { question: "", answer: "", display_order: 0, is_active: true };

const AdminFaqs = () => {
  const { profile } = useAuth();
  const { canAccess } = useFeaturePermissions();
  const { data: faqs, isLoading, error, refetch } = useFaqs();
  const { create, update, remove } = useFaqsMutations();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return faqs ?? [];
    const q = search.toLowerCase();
    return (faqs ?? []).filter((f: any) => f.question.toLowerCase().includes(q));
  }, [faqs, search]);

  if (!canAccess("faqs", profile?.role)) return <Navigate to="/admin" replace />;

  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (faq: any) => {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, display_order: faq.display_order, is_active: faq.is_active });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    if (editId) {
      await update.mutateAsync({ id: editId, ...form });
    } else {
      await create.mutateAsync(form);
    }
    setOpen(false);
  };

  const handleDelete = async (id: string, question: string) => {
    const ok = await confirm({ title: "Delete FAQ?", description: `"${question}" will be soft-deleted.` });
    if (ok) await remove.mutateAsync(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">FAQs</h1>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Add FAQ</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search FAQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>

      {error && <ErrorBox title="Failed to load FAQs" message={String(error)} onRetry={refetch} />}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-20">Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaqs.map((faq: any) => (
                <TableRow key={faq.id}>
                  <TableCell className="text-muted-foreground">{faq.display_order}</TableCell>
                  <TableCell className="font-medium text-foreground">{faq.question}</TableCell>
                  <TableCell>
                    <span className={`inline-block h-2 w-2 rounded-full ${faq.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id, faq.question)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredFaqs.length && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{search ? "No FAQs match your search" : "No FAQs yet"}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit FAQ" : "New FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="e.g. What are your lab hours?" />
            </div>
            <div>
              <Label>Answer</Label>
              <RichTextEditor value={form.answer} onChange={(html) => setForm({ ...form, answer: html })} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
              {create.isPending || update.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFaqs;
