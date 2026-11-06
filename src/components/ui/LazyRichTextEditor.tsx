"use client";

import dynamic from "next/dynamic";
import type { RichTextEditorProps } from "./RichTextEditor";

// Lazy-load RichTextEditor to reduce initial bundle size
// SSR disabled because TipTap uses browser-only APIs (window, selection, etc.)
export const LazyRichTextEditor = dynamic<
	RichTextEditorProps & { className?: string }
>(() => import("./RichTextEditor").then((mod) => mod.RichTextEditor), {
	ssr: false,
	loading: () => (
		<div className="min-h-[200px] rounded-2xl border border-black/10 bg-white/50 animate-pulse" />
	),
});