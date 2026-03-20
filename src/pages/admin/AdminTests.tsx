import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, ArrowUp, ArrowDown, ChevronDown, ChevronUp, X } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import useCategories from "@/hooks/useCategories";
import useTests from "@/hooks/useTests";
import { useCreateTest, useUpdateTest, useDeleteTest } from "@/hooks/useTests";
import { useSubTests, useCreateSubTest, useUpdateSubTest, useDeleteSubTest } from "@/hooks/useSubTests";
import { reorderItem } from "@/lib/api";

const AdminTests = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();
  const categoriesQuery = useCategories();
  const testsQuery = useTests({ active: false });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: 0, original_price: 0,
    sample_type: "Blood", report_time: "Same Day", category_id: "" as string | null,
    is_active: true, fasting_required: false, display_order: 0,
    show_on_homepage: false, discount_override: null as number | null,
  });

  const [reordering, setReordering] = useState<string | null>(null);

  // Sub-tests state
  const subTestsQuery = useSubTests(editing?.id ?? null);
  const createSubTest = useCreateSubTest();
  const updateSubTestMut = useUpdateSubTest();
  const deleteSubTestMut = useDeleteSubTest();
  const [newSubTestName, setNewSubTestName] = useState("");
  const [expandedSubTest, setExpandedSubTest] = useState<string | null>(null);
  const [subReordering, setSubReordering] = useState<string | null>(null);

  const handleSubReorder = async (id: string, direction: "up" | "down") => {
    setSubReordering(id);
    try {
      await reorderItem("sub_tests", id, direction);
      subTestsQuery.refetch();
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    } finally { setSubReordering(null); }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    setReordering(id);
    try {
      await reorderItem("tests", id, direction);
      testsQuery.refetch();
    } catch (err: any) {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    } finally { setReordering(null); }
  };

  const autoDiscountPct = form.original_price > 0 && form.original_price > form.price
    ? Math.round(((form.original_price - form.price) / form.original_price) * 100)
    : 0;

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "", slug: "", description: "", price: 0, original_price: 0,
      sample_type: "Blood", report_time: "Same Day", category_id: null, is_active: true,
      fasting_required: false, display_order: testsQuery.data?.length ?? 0,
      show_on_homepage: false, discount_override: null,
    });
    setSelectedCategoryIds([]);
    setOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      name: t.name, slug: t.slug, description: t.description || "", price: t.price,
      original_price: t.original_price || 0, sample_type: t.sample_type,
      report_time: t.report_time, category_id: t.category_id, is_active: t.is_active,
      fasting_required: t.fasting_required, display_order: t.display_order,
      show_on_homepage: t.show_on_homepage ?? false,
      discount_override: t.discount_override ?? null,
    });
    setSelectedCategoryIds((t.categories ?? []).map((c: any) => c.id));
    setOpen(true);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_ids: selectedCategoryIds,
        discount_override: form.discount_override || null,
      };
      if (editing) {
        await updateTest.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Test updated" });
      } else {
        await createTest.mutateAsync(payload);
        toast({ title: "Test created" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    const result = await confirm({
      title: "Delete Test",
      description: `Are you sure you want to delete "${name}"?`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await deleteTest.mutateAsync(id);
      toast({ title: "Test deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getCatNames = (t: any) =>
    (t.categories ?? []).map((c: any) => c.name).join(", ") || "—";

  const allTests = testsQuery.data ?? [];
  const filteredTests = useMemo(() => {
    if (!search.trim()) return allTests;
    const q = search.toLowerCase();
    return allTests.filter((t: any) =>
      t.name.toLowerCase().includes(q) ||
      (t.categories ?? []).some((c: any) => c.name.toLowerCase().includes(q))
    );
  }, [allTests, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Tests</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground w-16">Order</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Categories</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">MRP</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Discount</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Report</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Visibility</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Home</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTests.map((t: any) => {
              const disc = t.discount_override ??
                (t.original_price && t.original_price > t.price
                  ? Math.round(((t.original_price - t.price) / t.original_price) * 100)
                  : 0);
              return (
                <tr key={t.id} className={`border-t border-border ${!t.is_active ? "opacity-50" : ""}`}>
                  <td className="px-2 py-3">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={reordering === t.id} onClick={() => handleReorder(t.id, "up")}><ArrowUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={reordering === t.id} onClick={() => handleReorder(t.id, "down")}><ArrowDown className="h-3 w-3" /></Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">{t.display_order}</td>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getCatNames(t)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.original_price ? `₹${t.original_price}` : '—'}</td>
                  <td className="px-4 py-3">₹{t.price}</td>
                  <td className="px-4 py-3 text-muted-foreground">{disc > 0 ? `${disc}%` : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.report_time}</td>
                  <td className="px-4 py-3">{t.is_active ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</td>
                  <td className="px-4 py-3">{t.show_on_homepage ? "🏠" : "—"}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id, t.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {testsQuery.isLoading && <p className="p-6 text-center text-muted-foreground">Loading...</p>}
        {!testsQuery.isLoading && !filteredTests.length && <p className="p-6 text-center text-muted-foreground">{search ? "No tests match your search." : "No tests yet."}</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Test" : "New Test"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Test Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>MRP (₹)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: +e.target.value })} className="mt-1" /></div>
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="mt-1" /></div>
            </div>
            {autoDiscountPct > 0 && (
              <p className="text-xs text-muted-foreground">Auto discount: {autoDiscountPct}%</p>
            )}
            <div><Label>Discount Override (%)</Label><Input type="number" value={form.discount_override ?? ""} onChange={(e) => setForm({ ...form, discount_override: e.target.value ? +e.target.value : null })} placeholder="Leave empty for auto" className="mt-1" /></div>
            <div>
              <Label>Categories</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-border p-3">
                {(categoriesQuery.data ?? []).map((c: any) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedCategoryIds.includes(c.id)} onCheckedChange={() => toggleCategory(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Report Time</Label><Input value={form.report_time} onChange={(e) => setForm({ ...form, report_time: e.target.value })} placeholder="Same Day, 24 Hours, 48 Hours" className="mt-1" /></div>
            <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: +e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> <Label>Visible</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.show_on_homepage} onCheckedChange={(v) => setForm({ ...form, show_on_homepage: v })} /> <Label>Show on Home</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.fasting_required} onCheckedChange={(v) => setForm({ ...form, fasting_required: v })} /> <Label>Fasting</Label></div>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>

            {/* Sub-tests Section */}
            {editing ? (
              <div className="border-t border-border pt-4 mt-2">
                <h4 className="font-semibold text-sm text-foreground mb-3">Sub-tests / Parameters</h4>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="New sub-test name..."
                    value={newSubTestName}
                    onChange={(e) => setNewSubTestName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubTestName.trim()) {
                        e.preventDefault();
                        createSubTest.mutateAsync({
                          test_id: editing.id,
                          name: newSubTestName.trim(),
                          display_order: (subTestsQuery.data ?? []).length,
                        }).then(() => {
                          setNewSubTestName("");
                          toast({ title: "Sub-test added" });
                        }).catch((err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }));
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!newSubTestName.trim() || createSubTest.isPending}
                    onClick={() => {
                      createSubTest.mutateAsync({
                        test_id: editing.id,
                        name: newSubTestName.trim(),
                        display_order: (subTestsQuery.data ?? []).length,
                      }).then(() => {
                        setNewSubTestName("");
                        toast({ title: "Sub-test added" });
                      }).catch((err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {subTestsQuery.isLoading && <p className="text-xs text-muted-foreground">Loading sub-tests...</p>}
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {(subTestsQuery.data ?? []).map((st: any) => (
                    <div key={st.id} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button type="button" disabled={subReordering === st.id} onClick={() => handleSubReorder(st.id, "up")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                          <button type="button" disabled={subReordering === st.id} onClick={() => handleSubReorder(st.id, "down")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                        </div>
                        <span className="flex-1 text-sm font-medium truncate">{st.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={st.is_visible}
                              onCheckedChange={(v) => updateSubTestMut.mutateAsync({ id: st.id, is_visible: v })}
                              className="scale-75"
                            />
                            <span className="text-[10px] text-muted-foreground">Visible</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={st.show_as_individual}
                              onCheckedChange={(v) => {
                                updateSubTestMut.mutateAsync({ id: st.id, show_as_individual: v });
                                if (v && expandedSubTest !== st.id) setExpandedSubTest(st.id);
                              }}
                              className="scale-75"
                            />
                            <span className="text-[10px] text-muted-foreground">Individual</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedSubTest(expandedSubTest === st.id ? null : st.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedSubTest === st.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await confirm({ title: "Delete Sub-test", description: `Delete "${st.name}"?`, confirmLabel: "Delete", variant: "destructive" });
                              if (res.confirmed) {
                                deleteSubTestMut.mutateAsync(st.id).then(() => toast({ title: "Sub-test deleted" })).catch((err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }));
                              }
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {expandedSubTest === st.id && (
                        <SubTestDetailForm subTest={st} onSave={(updates) => {
                          updateSubTestMut.mutateAsync({ id: st.id, ...updates })
                            .then(() => toast({ title: "Sub-test updated" }))
                            .catch((err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }));
                        }} />
                      )}
                    </div>
                  ))}
                </div>
                {(subTestsQuery.data ?? []).length === 0 && !subTestsQuery.isLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">No sub-tests yet. Add one above.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-2">Save the test first to manage sub-tests.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Inline detail form for an individual sub-test
function SubTestDetailForm({ subTest, onSave }: { subTest: any; onSave: (updates: any) => void }) {
  const [f, setF] = useState({
    name: subTest.name ?? "",
    slug: subTest.slug ?? "",
    description: subTest.description ?? "",
    price: subTest.price ?? 0,
    original_price: subTest.original_price ?? 0,
    sample_type: subTest.sample_type ?? "Blood",
    report_time: subTest.report_time ?? "Same Day",
    fasting_required: subTest.fasting_required ?? false,
    discount_override: subTest.discount_override ?? null as number | null,
  });

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-0.5 h-8 text-xs" /></div>
        <div><Label className="text-xs">Slug</Label><Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto" className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <div><Label className="text-xs">Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="mt-0.5 text-xs" rows={2} /></div>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">MRP (₹)</Label><Input type="number" value={f.original_price} onChange={(e) => setF({ ...f, original_price: +e.target.value })} className="mt-0.5 h-8 text-xs" /></div>
        <div><Label className="text-xs">Price (₹)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} className="mt-0.5 h-8 text-xs" /></div>
        <div><Label className="text-xs">Discount %</Label><Input type="number" value={f.discount_override ?? ""} onChange={(e) => setF({ ...f, discount_override: e.target.value ? +e.target.value : null })} placeholder="auto" className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Sample Type</Label><Input value={f.sample_type} onChange={(e) => setF({ ...f, sample_type: e.target.value })} className="mt-0.5 h-8 text-xs" /></div>
        <div><Label className="text-xs">Report Time</Label><Input value={f.report_time} onChange={(e) => setF({ ...f, report_time: e.target.value })} className="mt-0.5 h-8 text-xs" /></div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={f.fasting_required} onCheckedChange={(v) => setF({ ...f, fasting_required: v })} className="scale-75" />
        <Label className="text-xs">Fasting Required</Label>
      </div>
      <Button size="sm" className="w-full" onClick={() => onSave(f)}>Save Details</Button>
    </div>
  );
}

export default AdminTests;
