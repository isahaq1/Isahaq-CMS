'use client';

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Link2, Link2Off,
  AlignLeft, AlignCenter, AlignRight, Pilcrow, Undo2, Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  compact?: boolean;
}

export function FooterTextEditor({ value, onChange, compact = false }: FooterTextEditorProps) {
  // Track whether the current update came from setContent (external), not user input
  const suppressUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'footer-link' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      if (!suppressUpdate.current) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${compact ? 'min-h-[140px]' : 'min-h-[240px]'} p-3 text-sm`,
      },
    },
  });

  // Sync external value when it changes (e.g. initial load from API)
  // Skip if editor is focused (user is actively typing)
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      suppressUpdate.current = true;
      editor.commands.setContent(value || '<p></p>');
      suppressUpdate.current = false;
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-gray-50 select-none">

        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="w-3 h-3" />
        </Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="w-3 h-3" />
        </Btn>
        <Sep />

        <Btn title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow className="w-3 h-3" />
        </Btn>
        {([1, 2, 3] as const).map((lvl) => (
          <Btn key={lvl} title={`Heading ${lvl}`}
            active={editor.isActive('heading', { level: lvl })}
            onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}>
            <span className="font-bold text-[10px] leading-none">H{lvl}</span>
          </Btn>
        ))}
        <Sep />

        <Btn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-3 h-3" />
        </Btn>
        <Btn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-3 h-3" />
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-3 h-3" />
        </Btn>
        <Sep />

        <Btn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-3 h-3" />
        </Btn>
        <Btn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-3 h-3" />
        </Btn>
        <Sep />

        <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-3 h-3" />
        </Btn>
        <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-3 h-3" />
        </Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-3 h-3" />
        </Btn>
        <Sep />

        <Btn title="Set link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="w-3 h-3" />
        </Btn>
        {editor.isActive('link') && (
          <Btn title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <Link2Off className="w-3 h-3" />
          </Btn>
        )}
        <Sep />

        <label className="flex items-center gap-1 cursor-pointer" title="Text color">
          <span className="text-[10px] font-semibold text-gray-500 select-none">A</span>
          <input type="color"
            className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
            value={(editor.getAttributes('textStyle').color as string | undefined) || '#000000'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
        </label>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({ children, active, disabled, onClick, title }: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      className={cn(
        'p-1 rounded flex items-center justify-center min-w-[22px] h-[22px] text-xs transition-colors',
        active ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-200',
        disabled && 'opacity-30 cursor-not-allowed',
      )}>
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0" />;
}
