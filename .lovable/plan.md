

## FAQ Feature — Data-Driven with Rich Text Editing

### What We're Building
1. A new `faqs` database table for admin-managed FAQ entries
2. API endpoints for CRUD operations on FAQs
3. Admin page to manage FAQs with a rich text editor (using `react-quill` or `tiptap`) for answers
4. A public `/faq` page showing all FAQs in an accordion
5. A FAQ preview section on the homepage

### Database

New `faqs` table:
- `id` (uuid, PK)
- `question` (text, not null)
- `answer` (text, not null — stores HTML from rich text editor)
- `display_order` (integer, default 0)
- `is_active` (boolean, default true)
- `slug` (text)
- `created_by`, `updated_by` (uuid)
- `created_at`, `updated_at` (timestamptz)
- `deleted_at` (timestamptz, soft delete)

RLS: public read for active non-deleted rows, admin manage all.

### NPM Package

**`@tiptap/react`** with `@tiptap/starter-kit` and `@tiptap/extension-link` — lightweight, headless rich text editor that integrates cleanly with Tailwind. Outputs HTML stored directly in the `answer` column.

### API Layer

Add `faqs` to the existing `crudConfig` in `supabase/functions/api/index.ts`:
```
faqs: { table: "faqs", entity: "faq", softDelete: true, nameField: "question" }
```

This gives us `GET/POST/PUT/DELETE /faqs` and `/faqs/:id` automatically, with activity logging.

### Frontend Changes

| File | Change |
|---|---|
| `src/pages/admin/AdminFaqs.tsx` | New admin CRUD page with TipTap rich text editor for answers |
| `src/pages/FaqPage.tsx` | Public FAQ page using Accordion component |
| `src/pages/Index.tsx` | Add a "Frequently Asked Questions" section before CTA |
| `src/hooks/useFaqs.ts` | Hook to fetch FAQs via API |
| `src/App.tsx` | Add `/faq` route and `/admin/faqs` route |
| `src/pages/admin/AdminLayout.tsx` | Add FAQ nav link |
| `src/components/Navbar.tsx` | Add FAQ link to public nav |
| `src/components/RichTextEditor.tsx` | Reusable TipTap editor component with toolbar (bold, italic, headings, links, lists) |

### Rich Text Editor UI
A toolbar with: Bold, Italic, H2, H3, Bullet List, Ordered List, Link — rendered above the editable area, styled with Tailwind to match the admin theme. The output HTML is stored as-is and rendered on the public page using `dangerouslySetInnerHTML` with Tailwind typography (`prose` class).

### Dashboard
Add FAQ count to the dashboard counts endpoint and `AdminDashboard.tsx`.

