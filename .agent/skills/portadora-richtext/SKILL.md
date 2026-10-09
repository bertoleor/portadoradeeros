---
name: portadora-richtext
description: >
  Tiptap rich-text editor conventions for portadora-eros (hydration, sanitize, image). Trigger: when
  editing rich-text editing/rendering or Tiptap config in this repo.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: '1.0'
---

# Rich Text (Tiptap) — portadora-eros

Source: `src/components/ui/RichTextEditor.tsx` (and `src/components/admin/RichTextEditor.tsx`).
Stack: `@tiptap/*@3.20.1` (StarterKit, Placeholder, Link, TextAlign, Image, Underline).

## MUST

- MUST render empty until mounted (`mounted` state set via `useEffect`) to avoid **hydration
  errors** — Tiptap's `useEditor` produces client-only DOM.
- MUST emit rich content via `onUpdate: ({ editor }) => onChange?.(editor.getHTML())`,
  storing/consuming **HTML strings**, not the JSON/ProseMirror doc.
- MUST keep the editor `editable` flag plumbed through the `editable` prop so the same component
  renders read-only content (no toolbar).
- MUST sanitize untrusted rich text before rendering it as HTML (the repo ships `sanitize-html`) —
  never `dangerouslySetInnerHTML` with raw stored HTML.

## SHOULD

- SHOULD restrict headings to `levels: [2, 3]` (StarterKit `heading` config) so `h1` is reserved for
  the page layout (SEO/outline).
- SHOULD disable link "open on click" (`LinkExtension.configure({ openOnClick: false })`) inside the
  editor and style links manually via `HTMLAttributes`.
- SHOULD drive toolbar buttons through a shared `ToolbarButton` (active/disabled states) rather than
  inline buttons per feature.
- SHOULD reuse the single `ui/RichTextEditor` component instead of a separate `admin/RichTextEditor`
  copy.

## NEVER

- Never render stored rich text with `dangerouslySetInnerHTML` without `sanitize-html` first.
- Never rely on `editor` being non-null on first render — guard with
  `if (!mounted || !editor) return <placeholder/>`.
- Never `onClick` links navigate by default (keep `openOnClick: false` in editing context so users
  can edit the URL, not follow it).

## Editor config (canonical)

```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] } }),
    Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty ...' }),
    LinkExtension.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-black underline ...' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ HTMLAttributes: { class: 'rounded-2xl ...' } }),
  ],
  content,
  editable,
  onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
});
```

## Examples

### ✅ Hydration-safe mount guard

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);
if (!mounted || !editor) return <div className={...} />; // placeholder box
```

### ✅ Toolbar action via chain

```typescript
editor.chain().focus().toggleBold().run();
editor.isActive('bold'); // styling input state
```

### ✅ Image/link insertion (URL prompt)

```typescript
const url = globalThis.window.prompt('URL:');
if (url) editor.chain().focus().setLink({ href: url }).run();
```
