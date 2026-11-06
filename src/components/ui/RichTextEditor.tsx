'use client';

import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface RichTextEditorProps {
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
  readonly 'aria-pressed'?: boolean;
  readonly 'aria-disabled'?: boolean;
  readonly role?: string;
  readonly tabIndex?: number;
}

const ToolbarButton = ({
  onClick,
  isActive,
  disabled = false,
  children,
  title,
  'aria-pressed': ariaPressed,
  'aria-disabled': ariaDisabled,
  role = 'button',
  tabIndex = 0,
}: ToolbarButtonProps) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    title={title}
    role={role}
    tabIndex={tabIndex}
    aria-pressed={ariaPressed}
    aria-disabled={ariaDisabled || disabled}
    className={`p-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 ${
      isActive
        ? 'bg-white/60 backdrop-blur-sm text-[rgba(15,15,20,0.85)] shadow-sm border border-white/50'
        : 'text-[rgba(15,15,20,0.45)] hover:text-[rgba(15,15,20,0.85)] hover:bg-white/30'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
  >
    {children}
  </button>
);

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe aquí...',
  className = '',
  editable = true,
}: RichTextEditorProps) {
  // Prevent hydration errors by rendering empty until mounted
  const [mounted, setMounted] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation for toolbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const buttons = toolbarRef.current?.querySelectorAll('button[role="button"]:not(:disabled)');
      if (!buttons || buttons.length === 0) {
        return;
      }

      const activeIndex = Array.from(buttons).findIndex((btn) => btn === document.activeElement);

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (activeIndex + 1) % buttons.length;
        (buttons[nextIndex] as HTMLElement).focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (activeIndex - 1 + buttons.length) % buttons.length;
        (buttons[prevIndex] as HTMLElement).focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        (buttons[0] as HTMLElement).focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        (buttons[buttons.length - 1] as HTMLElement).focus();
      } else if (e.key === 'Escape') {
        // Return focus to editor content
        const editorContent = toolbarRef.current?.nextElementSibling as HTMLElement;
        editorContent?.focus();
      }
    };

    const toolbar = toolbarRef.current;
    toolbar?.addEventListener('keydown', handleKeyDown);
    return () => toolbar?.removeEventListener('keydown', handleKeyDown);
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
        emptyEditorClass:
          'is-editor-empty before:content-[attr(data-placeholder)] before:text-black/30 before:float-left before:pointer-events-none before:h-0',
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            'text-black underline underline-offset-4 decoration-black/20 hover:decoration-black/60 transition-colors cursor-pointer',
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
        class:
          'min-h-[150px] w-full bg-transparent px-5 py-4 outline-none [&>p]:mb-4 last:[&>p]:mb-0 [&>h2]:text-2xl [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:mb-4 [&>h2]:mt-6 first:[&>h2]:mt-0 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:mb-3 [&>h3]:mt-5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>li]:mb-1 text-black/80 font-light leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!mounted || !editor) {
    return (
      <div
        className={`min-h-[200px] rounded-2xl border border-black/10 bg-white/50 ${className}`}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
      />
    );
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    if (previousUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = globalThis.window.prompt('URL:');
    if (url === null) {
      return;
    }
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
    <div
      className={`rounded-2xl border border-black/10 overflow-hidden bg-white focus-within:border-black/30 focus-within:ring-4 focus-within:ring-black/5 transition-all duration-300 ${className}`}
    >
      {/* Toolbar */}
      {editable && (
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Editor de texto enriquecido"
          className="flex flex-wrap items-center gap-1 p-2 border-b border-[rgba(15,15,20,0.08)] bg-white/20 backdrop-blur-sm"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrita"
            aria-pressed={editor.isActive('bold')}
          >
            <Bold size={16} strokeWidth={editor.isActive('bold') ? 2.5 : 2} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Cursiva"
            aria-pressed={editor.isActive('italic')}
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Tachado"
            aria-pressed={editor.isActive('strike')}
          >
            <Strikethrough size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" aria-hidden="true" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Título"
            aria-pressed={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" aria-hidden="true" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Alinear a la izquierda"
            aria-pressed={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Centrar"
            aria-pressed={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Alinear a la derecha"
            aria-pressed={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" aria-hidden="true" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista con viñetas"
            aria-pressed={editor.isActive('bulletList')}
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
            aria-pressed={editor.isActive('orderedList')}
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <div className="w-px h-5 bg-black/10 mx-1.5" aria-hidden="true" />

          <ToolbarButton
            onClick={toggleLink}
            isActive={editor.isActive('link')}
            title="Insertar enlace"
            aria-pressed={editor.isActive('link')}
          >
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            isActive={editor.isActive('image')}
            title="Insertar imagen (URL)"
            aria-pressed={editor.isActive('image')}
          >
            <ImagePlus size={16} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <div
        className="bg-white"
        role="textbox"
        aria-multiline="true"
        aria-label="Contenido del editor"
        tabIndex={0}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
