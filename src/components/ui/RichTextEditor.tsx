'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, Strikethrough, Heading2, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link as LinkIcon, ImagePlus
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  readonly content: string;
  readonly onChange?: (content: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly editable?: boolean;
}

interface ToolbarButtonProps {
  readonly onClick: () => void;
  readonly isActive: boolean;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
  readonly title: string;
}

const ToolbarButton = ({ onClick, isActive, disabled = false, children, title }: ToolbarButtonProps) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-black text-white shadow-sm' 
        : 'text-black/50 hover:text-black hover:bg-black/5'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
  >
    {children}
  </button>
);

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Escribe aquí...", 
  className = "",
  editable = true
}: RichTextEditorProps) {
  // Prevent hydration errors by rendering empty untill mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-black/30 before:float-left before:pointer-events-none before:h-0',
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-black underline underline-offset-4 decoration-black/20 hover:decoration-black/60 transition-colors cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-2xl border border-black/5 shadow-sm max-w-full h-auto my-6',
        },
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        // Minimalist iOS style typography for the content
        class: 'min-h-[150px] w-full bg-transparent px-5 py-4 outline-none [&>p]:mb-4 last:[&>p]:mb-0 [&>h2]:text-2xl [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:mb-4 [&>h2]:mt-6 first:[&>h2]:mt-0 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:mb-3 [&>h3]:mt-5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>li]:mb-1 text-black/80 font-light leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!mounted || !editor) {
    return <div className={`min-h-[200px] rounded-2xl border border-black/10 bg-white/50 ${className}`} />;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    if (previousUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = globalThis.window.prompt('URL:');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = globalThis.window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };


  return (
    <div className={`rounded-2xl border border-black/10 overflow-hidden bg-white focus-within:border-black/30 focus-within:ring-4 focus-within:ring-black/5 transition-all duration-300 ${className}`}>
      
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-black/5 bg-gray-50/50">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrita">
            <Bold size={16} strokeWidth={editor.isActive('bold') ? 2.5 : 2} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Cursiva">
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Tachado">
            <Strikethrough size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título">
            <Heading2 size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Alinear a la izquierda">
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Centrar">
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Alinear a la derecha">
            <AlignRight size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista con viñetas">
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista numerada">
            <ListOrdered size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" />

          <ToolbarButton onClick={toggleLink} isActive={editor.isActive('link')} title="Insertar enlace">
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} isActive={editor.isActive('image')} title="Insertar imagen (URL)">
            <ImagePlus size={16} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
