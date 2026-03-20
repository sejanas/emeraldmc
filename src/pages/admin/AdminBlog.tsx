import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { Plus, Pencil, Trash2, Search, ExternalLink, Eye, Send, Archive, X } from "lucide-react";
import { useBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog } from "@/hooks/useBlogs";
import ImageUpload from "@/components/ImageUpload";
import RichTextEditor from "@/components/RichTextEditor";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  published: "bg-green-500/20 text-green-700 dark:text-green-400",
  archived: "bg-muted text-muted-foreground",
};

const emptyForm = {
  title: "", slug: "", content: "", excerpt: "", featured_image: "",
  author: "", author_credentials: "", category: "", tags: "",
  meta_title: "", meta_description: "", external_url: "", status: "draft",
  scheduled_at: "", read_time: "",
};

const AdminBlog = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const blogsQuery = useBlogs({ all: true });
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title || "", slug: b.slug || "", content: b.content || "",
      excerpt: b.excerpt || "", featured_image: b.featured_image || "",
      author: b.author || "", author_credentials: b.author_credentials || "",
      category: b.category || "",
      tags: Array.isArray(b.tags) ? b.tags.join(", ") : "",
      meta_title: b.meta_title || "", meta_description: b.meta_description || "",
      external_url: b.external_url || "", status: b.status || "draft",
      scheduled_at: b.scheduled_at ? b.scheduled_at.slice(0, 16) : "",
      read_time: b.read_time || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const payload: any = {
        ...form,
        tags,
        slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      };
      if (payload.status === "published" && !editing?.published_at) {
        payload.published_at = new Date().toISOString();
      }
      if (editing) {
        await updateBlog.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Blog updated" });
      } else {
        await createBlog.mutateAsync(payload);
        toast({ title: "Blog created" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string, title: string) => {
    const r = await confirm({ title: "Delete Blog", description: `Delete "${title}"?`, confirmLabel: "Delete", variant: "destructive" });
    if (!r.confirmed) return;
    try { await deleteBlog.mutateAsync(id); toast({ title: "Blog deleted" }); }
    catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const setStatus = async (blog: any, status: string) => {
    try {
      const payload: any = { id: blog.id, status };
      if (status === "published" && !blog.published_at) payload.published_at = new Date().toISOString();
      await updateBlog.mutateAsync(payload);
      toast({ title: `Blog ${status}` });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const blogs = blogsQuery.data ?? [];
  const filtered = useMemo(() => {
    let items = blogs;
    if (statusFilter !== "all") items = items.filter((b: any) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((b: any) => b.title?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q));
    }
    return items;
  }, [blogs, statusFilter, search]);

  const statuses = ["all", "draft", "review", "scheduled", "published", "archived"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Blog</h1>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> New Post</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize">
            {s} {s !== "all" && `(${blogs.filter((b: any) => b.status === s).length})`}
          </Button>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b: any) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="font-medium">{b.title}</span>
                  {b.external_url && <ExternalLink className="inline ml-1 h-3 w-3 text-muted-foreground" />}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.category || "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[b.status] || ""}>{b.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {b.published_at ? new Date(b.published_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  {b.status === "draft" && (
                    <Button variant="ghost" size="icon" title="Publish" onClick={() => setStatus(b, "published")}>
                      <Send className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {b.status === "published" && (
                    <Button variant="ghost" size="icon" title="Archive" onClick={() => setStatus(b, "archived")}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  {b.slug && b.status === "published" && (
                    <Button variant="ghost" size="icon" title="View" asChild>
                      <a href={b.external_url || `/blog/${b.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id, b.title)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {blogsQuery.isLoading && (
          <div className="p-6 flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading blog posts...</p>
          </div>
        )}
        {!blogsQuery.isLoading && !filtered.length && <p className="p-6 text-center text-muted-foreground">No blog posts yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="mt-1" /></div>
            </div>
            <div><Label>Featured Image</Label><div className="mt-1"><ImageUpload value={form.featured_image} onChange={(url) => setForm({ ...form, featured_image: url })} folder="blog" aspectRatio="16:9" /></div></div>
            <div><Label>External URL (leave empty for internal content)</Label><Input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
            {!form.external_url && (
              <div><Label>Content</Label><div className="mt-1"><RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} /></div></div>
            )}
            <div><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1" rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1" /></div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="mt-1" /></div>
              <div><Label>Read Time</Label><Input value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} placeholder="5 min read" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="mt-1" /></div>
              <div><Label>Author Credentials</Label><Input value={form.author_credentials} onChange={(e) => setForm({ ...form, author_credentials: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meta Title</Label><Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="mt-1" /></div>
              <div><Label>Meta Description</Label><Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {form.status === "scheduled" && (
                <div><Label>Scheduled At</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="mt-1" /></div>
              )}
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
