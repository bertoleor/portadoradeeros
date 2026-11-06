"use client";

import dynamic from "next/dynamic";
import type { ImageUploaderProps } from "./ImageUploader";

// Lazy-load ImageUploader to reduce initial bundle size
// SSR disabled because it uses drag/drop and file upload APIs
export const LazyImageUploader = dynamic<
	ImageUploaderProps & { className?: string }
>(() => import("./ImageUploader").then((mod) => mod.ImageUploader), {
	ssr: false,
	loading: () => (
		<div className="w-full h-48 rounded-2xl border-2 border-dashed border-black/20 bg-gray-50/50 animate-pulse" />
	),
});