import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  ExternalLink,
  Sparkles,
  Tag,
  Settings2,
  FileText
} from 'lucide-react';

export interface ProductImageItem {
  id?: string;
  image_url: string;
  storage_path?: string;
  alt_text?: string;
  image_title?: string;
  sort_order: number;
  is_primary: boolean;
  uploading?: boolean;
  error?: string;
}

interface ProductImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  folder?: string;
  productName?: string;
  categoryName?: string;
  onImageUploaded?: (item: ProductImageItem, base64?: string) => void;
}

export default function ProductImageUploader({
  images,
  onChange,
  folder = 'products',
  productName = '',
  categoryName = '',
  onImageUploaded
}: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [autoGenerateSeo, setAutoGenerateSeo] = useState(true);
  const [editingDetailsIdx, setEditingDetailsIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to compute automatic SEO alt text
  const generateDynamicAlt = (idx: number, isPrimary: boolean): string => {
    const baseName = productName?.trim() || 'Product';
    if (isPrimary) {
      return `${baseName} - Front View`;
    }
    const angles = ['Side Angle', 'Display & Ports', 'Back View', 'Accessories & Packaging', 'Feature Detail', 'Lifestyle View'];
    const angleName = angles[idx - 1] || `Angle ${idx + 1}`;
    return `${baseName} - ${angleName}`;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGlobalError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setGlobalError(`File "${file.name}" is not a valid image format.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setGlobalError(`File "${file.name}" exceeds the maximum allowed size of 10MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create placeholder items with loading state
    const newItems: ProductImageItem[] = validFiles.map((file, idx) => {
      const tempPreview = URL.createObjectURL(file);
      const isFirst = images.length === 0 && idx === 0;
      const targetIndex = images.length + idx;
      
      const computedAlt = autoGenerateSeo 
        ? generateDynamicAlt(targetIndex, isFirst)
        : file.name.replace(/\.[^/.]+$/, '');

      return {
        image_url: tempPreview,
        storage_path: '',
        alt_text: computedAlt,
        image_title: computedAlt,
        sort_order: targetIndex,
        is_primary: isFirst,
        uploading: true
      };
    });

    const combined = [...images, ...newItems];
    onChange(combined);

    // Upload each file to Supabase Storage with sanitized SEO filename
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const targetIndex = images.length + i;
      const cleanSlug = (productName || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const ext = file.name.split('.').pop() || 'jpg';
      const sanitizedFileName = `${cleanSlug}-photo-${targetIndex + 1}-${Date.now()}.${ext}`;

      try {
        const base64 = await fileToBase64(file);
        const res = await fetch('/api/admin/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: sanitizedFileName,
            mimeType: file.type,
            folder
          })
        });

        const data = await res.json();
        if (res.ok && data.publicUrl) {
          const updatedItem: ProductImageItem = {
            ...combined[targetIndex],
            image_url: data.publicUrl,
            storage_path: data.storagePath,
            uploading: false,
            error: undefined
          };
          const updated = [...combined];
          updated[targetIndex] = updatedItem;
          onChange(updated);
          if (onImageUploaded) {
            onImageUploaded(updatedItem, base64);
          }
        } else {
          const updated = [...combined];
          updated[targetIndex] = {
            ...updated[targetIndex],
            uploading: false,
            error: data.error || 'Upload failed'
          };
          onChange(updated);
        }
      } catch (err: any) {
        const updated = [...combined];
        updated[targetIndex] = {
          ...updated[targetIndex],
          uploading: false,
          error: err.message || 'Upload failed'
        };
        onChange(updated);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index
    }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate sort_order
    const reordered = updated.map((img, idx) => ({
      ...img,
      sort_order: idx
    }));
    onChange(reordered);
  };

  const handleRemove = async (index: number) => {
    const itemToRemove = images[index];
    const updated = images.filter((_, idx) => idx !== index);

    if (itemToRemove.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }

    const reordered = updated.map((img, idx) => ({
      ...img,
      sort_order: idx
    }));
    onChange(reordered);

    if (itemToRemove.storage_path && !itemToRemove.storage_path.startsWith('http')) {
      try {
        await fetch('/api/admin/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: itemToRemove.storage_path })
        });
      } catch (err) {
        console.warn('Storage delete cleanup error:', err);
      }
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const isFirst = images.length === 0;
    const computedAlt = autoGenerateSeo 
      ? generateDynamicAlt(images.length, isFirst)
      : 'Product Image';

    const newItem: ProductImageItem = {
      image_url: manualUrl.trim(),
      storage_path: manualUrl.trim(),
      alt_text: computedAlt,
      image_title: computedAlt,
      sort_order: images.length,
      is_primary: isFirst,
      uploading: false
    };
    onChange([...images, newItem]);
    setManualUrl('');
    setShowManualInput(false);
  };

  const handleUpdateAltText = (index: number, alt: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], alt_text: alt };
    onChange(updated);
  };

  const handleUpdateTitle = (index: number, title: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], image_title: title };
    onChange(updated);
  };

  const handleApplyAutoSeoToAll = () => {
    const updated = images.map((img, idx) => {
      const alt = generateDynamicAlt(idx, img.is_primary);
      return {
        ...img,
        alt_text: alt,
        image_title: alt
      };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4" id="product-image-uploader-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-200">
            Product Images &amp; Supabase Storage
          </label>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Images are saved in Supabase Storage with dynamic SEO alt texts, responsive resolutions, and search schema tags.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Auto SEO toggle */}
          <button
            type="button"
            onClick={() => setAutoGenerateSeo(!autoGenerateSeo)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
              autoGenerateSeo
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Auto-generate descriptive SEO alt tags and titles"
          >
            <Sparkles className="w-3 h-3" />
            <span>{autoGenerateSeo ? 'Auto SEO Alt Tags [ON]' : 'Auto SEO [OFF]'}</span>
          </button>

          {images.length > 0 && (
            <button
              type="button"
              onClick={handleApplyAutoSeoToAll}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition flex items-center gap-1 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20"
              title="Apply naming template to all existing photos"
            >
              <Tag className="w-3 h-3" />
              <span>Regenerate Alt Texts</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] font-semibold text-slate-300 hover:text-white transition flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
          >
            <Plus className="w-3 h-3" />
            <span>{showManualInput ? 'Hide URL' : 'Add by URL'}</span>
          </button>
        </div>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Manual URL Input */}
      {showManualInput && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://... (Supabase storage URL or external image)"
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
          >
            Add Image
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              Click to browse or drag &amp; drop product images
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Supports PNG, JPG, WebP up to 10MB each (Multi-select enabled)
            </p>
          </div>
        </div>
      </div>

      {/* Image Gallery List */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Uploaded Images ({images.length})
            </span>
            <span className="text-[11px]">
              ⭐ Star designates Primary (feeds Product Schema &amp; OpenGraph)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div
                key={index}
                className={`group relative bg-slate-950 border rounded-xl overflow-hidden p-2.5 flex flex-col justify-between transition-all ${
                  img.is_primary
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image Preview */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800/80">
                  <img
                    src={img.image_url}
                    alt={img.alt_text || 'Product image'}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Primary Badge */}
                  {img.is_primary && (
                    <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>PRIMARY / OPEN GRAPH</span>
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {img.uploading && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] gap-1">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Saving to Supabase Storage...</span>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {img.error && (
                    <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs p-2 flex flex-col items-center justify-center text-rose-300 text-[10px] text-center">
                      <AlertCircle className="w-4 h-4 text-rose-400 mb-1" />
                      <span>{img.error}</span>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white rounded-md transition shadow-md opacity-0 group-hover:opacity-100"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Image Controls & SEO Fields */}
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
                        img.is_primary
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${img.is_primary ? 'fill-current text-emerald-400' : ''}`} />
                      <span>{img.is_primary ? 'Primary Image' : 'Set as Primary'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'left')}
                        className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-800 transition"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => handleMove(index, 'right')}
                        className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-800 transition"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5 flex items-center justify-between">
                      <span>Image Alt Text (SEO):</span>
                      <span className="text-[9px] text-emerald-400 font-mono">
                        {img.alt_text ? `${img.alt_text.length} chars` : 'missing'}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wireless Gaming Mouse - Front Angle"
                      value={img.alt_text || ''}
                      onChange={(e) => handleUpdateAltText(index, e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
