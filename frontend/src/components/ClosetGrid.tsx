import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { Camera, CheckCircle2, Edit3, Save, X } from 'lucide-react';

interface ClosetItem {
  id: number;
  photoUrl: string;
  category: string;
  color: string;
  season: string;
  formality: string;
  createdAt: string;
}

const CATEGORIES = ['Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories'];
const FORMALITYS = ['Formal', 'Smart Casual', 'Casual'];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

export default function ClosetGrid() {
  const token = useStore((state) => state.token);
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ClosetItem>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
  const serverBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const { data: items = [], isLoading } = useQuery<ClosetItem[]>({
    queryKey: ['closet'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/closet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch closet');
      return res.json();
    },
    enabled: !!token
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`${apiBase}/closet`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closet'] });
      queryClient.invalidateQueries({ queryKey: ['todayCapsule'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ClosetItem> }) => {
      const res = await fetch(`${apiBase}/closet/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closet'] });
      setEditingId(null);
      setEditDraft({});
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerOpen(true);
    setScanStatus('scanning');
    setScanSteps([]);
    const steps = [
      'Connecting scanner sensors...',
      'Analysing silhouette geometry...',
      'Extracting dominant color wavelength...',
      'Classifying garment category...',
      'Verifying fabric composition...',
      'Archiving to Closet DNA...'
    ];
    steps.forEach((text, i) => {
      setTimeout(() => {
        setScanSteps((prev) => [...prev, text]);
        if (i === steps.length - 1) {
          setScanStatus('done');
          uploadMutation.mutate(file, {
            onSettled: () => {
              setTimeout(() => { setScannerOpen(false); setScanStatus('idle'); setScanSteps([]); }, 1200);
            }
          });
        }
      }, (i + 1) * 600);
    });
    e.target.value = '';
  };

  const filteredItems = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
      <p className="text-ink-secondary text-sm">Loading wardrobe...</p>
    </div>
  );

  return (
    <div className="relative w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
        <div>
          <h2 className="font-serif text-4xl text-ink-primary mb-2">Your Wardrobe</h2>
          <p className="text-ink-secondary text-sm">{items.length} garment{items.length !== 1 ? 's' : ''} digitised — AI-tagged on upload.</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-text text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
            <Camera size={15} /><span>Scan Garment</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 border-b border-borderHairline">
        {['All', ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-accent text-white shadow-sm' : 'bg-cardSurface border border-borderHairline text-ink-secondary hover:text-ink-primary'}`}>
            {cat}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20 border border-dashed border-borderHairline rounded-xl bg-cardSurface/30">
          <Camera size={32} className="text-ink-tertiary mx-auto mb-4" />
          <h3 className="font-serif text-xl text-ink-primary mb-2">Empty Wardrobe</h3>
          <p className="text-ink-secondary text-xs max-w-xs mx-auto mb-6">Upload your first garment photo to begin AI auto-tagging. No manual cataloguing required.</p>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-accent text-white text-xs font-semibold rounded-lg">Upload First Piece</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item, index) => {
          const offsetClass = index % 2 !== 0 ? 'mt-6' : '';
          const isEditing = editingId === item.id;
          return (
            <div key={item.id} className={`group bg-cardSurface border border-borderHairline rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${offsetClass}`}>
              <div className="relative aspect-[3/4] bg-paper overflow-hidden">
                {item.photoUrl ? (
                  <img src={item.photoUrl.startsWith('/') ? `${serverBase}${item.photoUrl}` : item.photoUrl} alt={item.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-borderHairline" style={{ backgroundColor: item.color }} />
                  </div>
                )}
                <button onClick={() => { setEditingId(item.id); setEditDraft({ category: item.category, color: item.color, season: item.season, formality: item.formality }); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-cardSurface/90 border border-borderHairline rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 size={11} className="text-ink-secondary" />
                </button>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <select value={editDraft.category} onChange={e => setEditDraft(d => ({ ...d, category: e.target.value }))} className="w-full text-[10px] p-1.5 bg-paper border border-borderHairline rounded text-ink-primary">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={editDraft.season} onChange={e => setEditDraft(d => ({ ...d, season: e.target.value }))} className="w-full text-[10px] p-1.5 bg-paper border border-borderHairline rounded text-ink-primary">
                      {SEASONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select value={editDraft.formality} onChange={e => setEditDraft(d => ({ ...d, formality: e.target.value }))} className="w-full text-[10px] p-1.5 bg-paper border border-borderHairline rounded text-ink-primary">
                      {FORMALITYS.map(f => <option key={f}>{f}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-ink-secondary">Color:</label>
                      <input type="color" value={editDraft.color || '#A39C8E'} onChange={e => setEditDraft(d => ({ ...d, color: e.target.value }))} className="w-8 h-6 border border-borderHairline rounded cursor-pointer" />
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => updateMutation.mutate({ id: item.id, data: editDraft })} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-accent text-white text-[10px] rounded font-semibold">
                        <Save size={10} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1.5 border border-borderHairline text-ink-secondary text-[10px] rounded"><X size={10} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">{item.category}</span>
                      <div className="w-3 h-3 rounded-full border border-borderHairline" style={{ backgroundColor: item.color }} />
                    </div>
                    <p className="text-[11px] text-ink-secondary">{item.formality}</p>
                    <p className="text-[10px] text-ink-tertiary mt-0.5">{item.season}</p>
                    <p className="text-[10px] text-ink-tertiary mt-1">Added {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {scannerOpen && (
        <div className="fixed inset-0 bg-paper/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-cardSurface border border-borderStrong p-8 max-w-sm w-full rounded-2xl shadow-xl">
            <div className="relative w-40 h-40 mx-auto rounded-xl overflow-hidden border border-borderHairline bg-paper mb-6">
              {scanStatus === 'scanning' && <div className="laser-scanner-line" />}
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={40} className="text-ink-tertiary/30" />
              </div>
            </div>
            <h3 className="font-serif text-xl text-ink-primary text-center mb-1">{scanStatus === 'done' ? 'Catalogued' : 'AI Auto-Tagging...'}</h3>
            <p className="text-ink-tertiary text-[11px] text-center mb-6">No manual tagging required.</p>
            <div className="bg-paper border border-borderHairline rounded-lg p-4 font-mono text-[10px] text-ink-secondary space-y-2 min-h-[120px]">
              {scanSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {(idx < scanSteps.length - 1 || scanStatus === 'done') ? (
                    <CheckCircle2 size={11} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
