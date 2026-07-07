'use client';

import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, Edit3, Trash2, Save, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { addClosetItem, updateClosetItem, deleteClosetItem } from '@/actions/wardrobe';

interface ClosetItem {
  id: string;
  photoUrl: string;
  thumbnailUrl: string;
  category: string;
  color: string;
  season: string;
  formality: string;
  createdAt: string;
}

interface ClosetGridProps {
  items: ClosetItem[];
}

const CATEGORIES = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories'];
const FORMALITIES = ['Formal', 'Smart Casual', 'Casual'];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

export default function ClosetGrid({ items: initialItems }: ClosetGridProps) {
  const [items, setItems] = useState<ClosetItem[]>(initialItems);
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [editItem, setEditItem] = useState<ClosetItem | null>(null);
  
  const [editCategory, setEditCategory] = useState('Tops');
  const [editColor, setEditColor] = useState('#A39C8E');
  const [editSeason, setEditSeason] = useState('Autumn');
  const [editFormality, setEditFormality] = useState('Smart Casual');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = categoryFilter === 'All'
    ? items
    : items.filter(i => i.category === categoryFilter);

  // Convert uploaded image to Base64 and trigger Server Action
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerOpen(true);
    setScanStatus('scanning');
    setScanLogs([]);

    const logSteps = [
      'Establishing connection to Gemini Vision service...',
      'Deconstructing silhouette coordinates...',
      'Extracting dominant color wavelengths...',
      'Determining garment structure class...',
      'Verifying seasonal insulation density...',
      'Syncing parameters to Style DNA profile...'
    ];

    // Log feedback simulation
    logSteps.forEach((step, idx) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, step]);
      }, (idx + 1) * 500);
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Str = reader.result as string;

      try {
        const res = await addClosetItem(base64Str, file.type, file.name);
        
        if (res.success && res.item) {
          // Success callback
          setTimeout(() => {
            setScanStatus('done');
            // Cast to local struct
            const formattedItem: ClosetItem = {
              id: res.item.id,
              photoUrl: res.item.photoUrl,
              thumbnailUrl: res.item.thumbnailUrl,
              category: res.item.category,
              color: res.item.color,
              season: res.item.season,
              formality: res.item.formality,
              createdAt: res.item.createdAt.toString()
            };
            setItems(prev => [formattedItem, ...prev]);
            
            setTimeout(() => {
              setScannerOpen(false);
              setScanStatus('idle');
            }, 1000);
          }, logSteps.length * 500 + 200);
        } else {
          setScannerOpen(false);
        }
      } catch (err) {
        console.error(err);
        setScannerOpen(false);
      }
    };
  };

  const handleEditClick = (item: ClosetItem) => {
    setEditItem(item);
    setEditCategory(item.category);
    setEditColor(item.color);
    setEditSeason(item.season);
    setEditFormality(item.formality);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      const res = await updateClosetItem(editItem.id, {
        category: editCategory,
        color: editColor,
        season: editSeason,
        formality: editFormality
      });

      if (res.success && res.item) {
        setItems(prev => prev.map(i => i.id === editItem.id ? {
          ...i,
          category: editCategory,
          color: editColor,
          season: editSeason,
          formality: editFormality
        } : i));
        setEditItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this garment?')) return;
    try {
      const res = await deleteClosetItem(id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        setEditItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-full space-y-8 animate-slide-up">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl font-bold text-foreground">Your Wardrobe</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} garments digitised — analyzed & catalogued by Gemini Vision.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
            <Camera size={14} />
            <span>Scan Garment</span>
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 border-b border-border/40">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
              categoryFilter === cat
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-card/45 border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Closet Grid with Asymmetric alignment */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-20 border border-dashed border-border/80 bg-card/30 rounded-2xl">
          <Camera size={32} className="text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">No garments found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6">
            Scan your first wardrobe piece to kickstart auto-tagging. No manual forms needed.
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload First Piece
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => {
            // Asymmetric layout logic (odd elements offset downwards slightly)
            const isOffset = index % 2 !== 0;
            return (
              <div
                key={item.id}
                onClick={() => handleEditClick(item)}
                className={`group cursor-pointer relative rounded-2xl overflow-hidden glass-panel ${
                  isOffset ? 'mt-6' : ''
                }`}
              >
                {/* Photo frame */}
                <div className="relative aspect-[3/4] bg-muted/30 overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                </div>

                {/* Details */}
                <div className="p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      {item.category}
                    </span>
                    <Edit3 size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">{item.formality}</p>
                  <p className="text-[10px] text-muted-foreground">{item.season}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCANNING OVERLAY MODAL */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <Card className="max-w-sm w-full p-8 text-center space-y-6 bg-card border border-border-strong shadow-xl">
            <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden border border-border/80 bg-background/30">
              {scanStatus === 'scanning' && <div className="laser-scanner-line" />}
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={36} className="text-muted-foreground/30 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-semibold">
                {scanStatus === 'done' ? 'Garment Logged!' : 'Gemini Auto-Tagging...'}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Scanning fabric properties
              </p>
            </div>

            <div className="bg-background/40 border border-border rounded-xl p-4 font-mono text-[9px] text-left text-muted-foreground space-y-2 min-h-[140px] max-h-[140px] overflow-y-auto">
              {scanLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 animate-fade-in">
                  {i < scanLogs.length - 1 || scanStatus === 'done' ? (
                    <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping flex-shrink-0 mt-1.5" />
                  )}
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* EDIT/DELETE TAGS MODAL */}
      <Dialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        title="Garment Specifications"
        description="Verify or modify tags classified by Gemini Vision."
      >
        {editItem && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1/3 aspect-[3/4] bg-muted rounded-xl overflow-hidden border border-border">
                <img src={editItem.thumbnailUrl} alt="Garment" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-xs"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Season</label>
                  <select
                    value={editSeason}
                    onChange={(e) => setEditSeason(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-xs"
                  >
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Formality</label>
                <select
                  value={editFormality}
                  onChange={(e) => setEditFormality(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-xs"
                >
                  {FORMALITIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dominant Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-10 border border-border rounded-xl cursor-pointer p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="flex-1 p-2 bg-background border border-border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => handleDelete(editItem.id)}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 size={13} className="mr-1" /> Remove
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                <Save size={13} className="mr-1" /> Save Config
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
