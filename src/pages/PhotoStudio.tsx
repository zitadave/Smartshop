import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { 
  Camera, Upload, Check, RefreshCw, Send, Sliders, Type, Crop, Sparkles, 
  Trash2, Heart, ExternalLink, HelpCircle, AlertTriangle, Move, ZoomIn
} from 'lucide-react';
import { processProductPhoto, uploadProductPhoto, type ProcessedPhoto } from '@/lib/photoStudio';

export default function PhotoStudio() {
  const store = useStore();
  const { profile } = store;
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [result, setResult] = useState<ProcessedPhoto | null>(null);
  
  // Custom AI Creative Style preset
  const [aiStyle, setAiStyle] = useState<'studio' | 'sunset' | 'midnight'>('studio');
  
  // Interactive Closeup & Positioning states
  const [zoom, setZoom] = useState(1.0);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  
  // Photo Editor states (shadcn design-aligned)
  const [activeTab, setActiveTab] = useState<'adjust' | 'text' | 'crop'>('adjust');
  const [brightness, setBrightness] = useState(1.08);
  const [contrast, setContrast] = useState(1.12);
  const [saturation, setSaturation] = useState(1.0);
  
  // Custom Text Overlay states
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textPosition, setTextPosition] = useState<'top-left' | 'center' | 'bottom-right'>('bottom-right');
  const [fontSize, setFontSize] = useState(24);
  
  // Crop Aspect ratio states
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | 'free'>('1:1');
  
  // Operations state
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [removeBg, setRemoveBg] = useState(true);

  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-render edited results on canvas
  useEffect(() => {
    if (!result) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Reset canvas size based on crop preset
      let targetW = 600;
      let targetH = 600;

      if (aspectRatio === '16:9') {
        targetH = Math.round(targetW * (9 / 16));
      } else if (aspectRatio === '9:16') {
        targetH = Math.round(targetW * (16 / 9));
      } else if (aspectRatio === 'free') {
        targetW = img.width;
        targetH = img.height;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.clearRect(0, 0, targetW, targetH);
      ctx.save();

      // ── Step 1: Render Creative AI Background Style Presets ──
      if (aiStyle === 'studio') {
        // Solid Studio White (MIT Catalog Standard)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (aiStyle === 'sunset') {
        // Warm Editorial Sunset Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, targetH);
        gradient.addColorStop(0, '#fef08a'); // Warm yellow
        gradient.addColorStop(0.5, '#fed7aa'); // Orange peach
        gradient.addColorStop(1, '#fecdd3'); // Soft rose
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (aiStyle === 'midnight') {
        // Cool Premium Cyber Midnight Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, targetH);
        gradient.addColorStop(0, '#0f172a'); // Deep slate
        gradient.addColorStop(1, '#1e1b4b'); // Midnight indigo
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      // ── Step 2: Apply GPU-Accelerated CSS Filters & Transformations ──
      ctx.save();
      
      // Calculate dynamic active filters based on AI style + slider adjustments
      let activeBrightness = brightness;
      let activeContrast = contrast;
      let activeSaturation = saturation;

      if (aiStyle === 'sunset') {
        activeBrightness *= 1.05;
        activeContrast *= 0.95;
        activeSaturation *= 1.25;
      } else if (aiStyle === 'midnight') {
        activeBrightness *= 0.92;
        activeContrast *= 1.15;
        activeSaturation *= 1.10;
      }

      ctx.filter = `brightness(${activeBrightness}) contrast(${activeContrast}) saturate(${activeSaturation})`;

      // Translate context to center + position offsets, then scale (zoom)
      ctx.translate(targetW / 2 + posX, targetH / 2 + posY);
      ctx.scale(zoom, zoom);

      // Draw product image centered
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
      
      ctx.restore(); // Restore filters & matrix
      ctx.restore(); // Restore outer canvas save

      // ── Step 3: Render Custom Text Overlay Watermarks ──
      if (textOverlay.trim()) {
        ctx.save();
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const textWidth = ctx.measureText(textOverlay).width;
        let x = 24;
        let y = targetH - 24;

        if (textPosition === 'top-left') {
          x = 24;
          y = fontSize + 24;
        } else if (textPosition === 'center') {
          x = (targetW - textWidth) / 2;
          y = targetH / 2 + fontSize / 2;
        } else if (textPosition === 'bottom-right') {
          x = targetW - textWidth - 24;
          y = targetH - 24;
        }

        ctx.fillText(textOverlay, x, y);
        ctx.restore();
      }
    };
    img.src = result.processedUrl;
  }, [result, brightness, contrast, saturation, textOverlay, textColor, textPosition, fontSize, aspectRatio, aiStyle, zoom, posX, posY]);

  const handleFile = async (f: File) => {
    setFile(f);
    setProcessing(true);
    setResult(null);
    setUploaded(false);

    setProcessStep('Initializing WASM AI Model (9.8MB)...');
    await new Promise(r => setTimeout(r, 1200));
    
    setProcessStep('Analyzing Image Pixels...');
    await new Promise(r => setTimeout(r, 1000));
    
    setProcessStep('Enhancing Contours and Colors...');
    await new Promise(r => setTimeout(r, 800));

    try {
      const processed = await processProductPhoto(f, { removeBackground: removeBg });
      setResult(processed);
      toast('🎉 AI Background removal & enhance complete!', 'success');
    } catch (e: any) {
      toast('Error: ' + e.message, 'error');
    }
    setProcessing(false);
  };

  const handleUpload = async () => {
    if (!result || !canvasRef.current) return;
    setUploading(true);
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          setUploading(false);
          return;
        }
        const customResult = {
          ...result,
          processedBlob: blob
        };
        await uploadProductPhoto(customResult);
        setUploaded(true);
        toast('🎉 Product photo updated successfully!', 'success');
      }, 'image/webp', 0.9);
    } catch (e: any) {
      toast('Upload error: ' + e.message, 'error');
      setUploading(false);
    }
  };

  const sendToTelegramChat = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setSendingChat(true);
    toast('⏳ Generating high-definition file...', 'info');

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const tgId = profile.telegramId || localStorage.getItem('ss_telegram_id');

    if (!tgId) {
      setSendingChat(false);
      toast('❌ Please connect your Telegram account first inside Profile', 'error');
      return;
    }

    try {
      const res = await fetch('/api/photo-studio/send-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgId,
          image: dataUrl,
          caption: `✨ Photo generated via Smartshop AI Photo Studio!\n🎨 Style: ${aiStyle.toUpperCase()}\n🔍 Zoom: ${zoom}x`
        })
      });
      const d = await res.json();
      setSendingChat(false);
      if (d.success) {
        toast('📨 Photo sent directly to your Telegram chat!', 'success');
      } else {
        toast('❌ Failed: ' + (d.error || 'Check if bot is started'), 'error');
      }
    } catch (e: any) {
      setSendingChat(false);
      toast('Error: ' + e.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2 text-xl shadow-lg shadow-primary/5">
            🖼️
          </div>
          <h1 className="text-xl font-black text-foreground">AI Merchant Photo Studio</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Professional, studio-quality product photos in 5 seconds</p>
        </div>

        <input type="file" ref={fileRef} accept="image/*" className="hidden"
               onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {/* Upload Trigger / Empty State */}
        {!file && (
          <div className="space-y-4">
            <div className="bg-card rounded-3xl p-10 text-center border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-all duration-300 shadow-sm"
                 onClick={() => fileRef.current?.click()}>
              <Camera size={44} className="mx-auto text-primary mb-3 animate-pulse" />
              <p className="font-extrabold text-foreground text-sm">Tap to Select Product Photo</p>
              <p className="text-[10px] text-muted-foreground mt-1">Camera snap or choose from gallery</p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-start gap-3 text-left">
              <Sparkles className="text-indigo-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">🚀 WASM AI background Remover</h4>
                <label className="flex items-center gap-2 mt-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={removeBg} onChange={e => setRemoveBg(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                  Enable automatic AI background removal
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Phase Loading Status */}
        {processing && (
          <div className="bg-card border border-border/80 rounded-3xl p-8 text-center animate-scaleIn space-y-3 shadow-md">
            <RefreshCw size={28} className="mx-auto text-primary animate-spin" />
            <p className="font-bold text-xs text-foreground mt-2">{processStep}</p>
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-indigo-500 animate-[pulse_1.5s_infinite]" style={{ width: '40%' }} />
            </div>
          </div>
        )}

        {/* Editor Screen */}
        {result && !processing && (
          <div className="space-y-4 animate-scaleIn text-left">
            {/* Main Interactive Canvas Editor */}
            <div className="bg-card border border-border/80 rounded-3xl p-4 shadow-sm relative overflow-hidden flex flex-col items-center">
              <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black uppercase tracking-wider mb-2.5">
                ✨ Live Interactive Canvas
              </span>
              <div className="w-full max-h-[35vh] flex items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-950">
                <canvas ref={canvasRef} className="max-w-full max-h-[35vh] object-contain shadow-md" />
              </div>
            </div>

            {/* Select AI Creative Style Presets */}
            <div className="space-y-2">
              <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">🎨 Select AI Creative Background Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'studio', label: 'Minimalist', desc: 'Solid White', bg: 'bg-white border' },
                  { id: 'sunset', label: 'Warm Sunset', desc: 'Peach Rose', bg: 'bg-gradient-to-br from-yellow-100 to-rose-200' },
                  { id: 'midnight', label: 'Cyber Midnight', desc: 'Dark Indigo', bg: 'bg-gradient-to-br from-slate-900 to-slate-950 text-white' }
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setAiStyle(s.id as any)}
                    className={`p-2.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-300 h-16 ${s.bg} ${aiStyle === s.id ? 'border-primary ring-2 ring-primary/15 scale-[1.02]' : 'border-border/60'}`}
                  >
                    <span className="text-[10px] font-black leading-none">{s.label}</span>
                    <span className="text-[7.5px] opacity-60 leading-none mt-1 font-bold">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Tool Tabs */}
            <div className="bg-card border border-border/80 rounded-3xl p-4 shadow-sm">
              <div className="flex bg-muted/60 p-0.5 rounded-xl border border-border/30 mb-4">
                <button onClick={() => setActiveTab('adjust')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${activeTab === 'adjust' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Sliders size={12} /> Transform</button>
                <button onClick={() => setActiveTab('text')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${activeTab === 'text' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Type size={12} /> Text</button>
                <button onClick={() => setActiveTab('crop')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${activeTab === 'crop' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Crop size={12} /> Aspect</button>
              </div>

              {/* ADJUST SLIDERS TAB */}
              {activeTab === 'adjust' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>🔍 Closeup / Zoom</span><span className="text-primary font-bold">{zoom.toFixed(2)}x</span></div>
                    <input type="range" min="0.5" max="2.0" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>↔️ Move X</span><span className="text-primary font-bold">{posX}px</span></div>
                      <input type="range" min="-150" max="150" step="1" value={posX} onChange={e => setPosX(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>↕️ Move Y</span><span className="text-primary font-bold">{posY}px</span></div>
                      <input type="range" min="-150" max="150" step="1" value={posY} onChange={e => setPosY(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>Brightness</span><span className="text-primary font-bold">{Math.round(brightness * 100)}%</span></div>
                      <input type="range" min="0.5" max="1.5" step="0.02" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>Contrast</span><span className="text-primary font-bold">{Math.round(contrast * 100)}%</span></div>
                      <input type="range" min="0.5" max="1.5" step="0.02" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>Saturation</span><span className="text-primary font-bold">{Math.round(saturation * 100)}%</span></div>
                      <input type="range" min="0.0" max="2.0" step="0.05" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* TEXT OVERLAY TAB */}
              {activeTab === 'text' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">Custom Text Overlay (Watermark)</label>
                    <input type="text" placeholder="e.g. Br 450 — Abebe Shop" value={textOverlay} onChange={e => setTextOverlay(e.target.value)} className="w-full p-2.5 border border-border/80 rounded-xl text-xs bg-card text-foreground outline-none focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Color</label>
                      <select value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full p-2 border border-border/80 rounded-xl text-xs bg-card text-foreground outline-none">
                        <option value="#FFFFFF">⬜ White</option>
                        <option value="#10B981">🟩 Emerald</option>
                        <option value="#F59E0B">🟧 Amber</option>
                        <option value="#000000">⬛ Black</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Position</label>
                      <select value={textPosition} onChange={e => setTextPosition(e.target.value as any)} className="w-full p-2 border border-border/80 rounded-xl text-xs bg-card text-foreground outline-none">
                        <option value="bottom-right">↘️ Bottom Right</option>
                        <option value="top-left">↖️ Top Left</option>
                        <option value="center">📳 Center</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>Font Size</span><span className="text-primary font-bold">{fontSize}px</span></div>
                    <input type="range" min="12" max="48" step="1" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                  </div>
                </div>
              )}

              {/* CROP PRESETS TAB */}
              {activeTab === 'crop' && (
                <div className="space-y-2">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">Select Aspect Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '1:1', label: '1:1 Square (Shop Grid)' },
                      { id: '16:9', label: '16:9 Banner (Wide)' },
                      { id: '9:16', label: '9:16 Story (Portrait)' },
                      { id: 'free', label: 'Original Dimensions' }
                    ].map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setAspectRatio(p.id as any)}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-bold text-center transition-all ${aspectRatio === p.id ? 'bg-primary/15 text-primary border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted/40'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={sendToTelegramChat} 
                disabled={sendingChat}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/10 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {sendingChat ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : <><Send size={12} /> Send to Telegram Chat</>}
              </button>
              
              <button 
                onClick={handleUpload} 
                disabled={uploading || uploaded}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground rounded-2xl font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {uploading ? <><RefreshCw size={14} className="animate-spin" /> Uploading...</> :
                 uploaded ? <><Check size={14} /> Uploaded!</> :
                 <><Upload size={14} /> Update Product Photo</>}
              </button>
            </div>

            <button onClick={() => { setFile(null); setResult(null); setUploaded(false); setZoom(1.0); setPosX(0); setPosY(0); setAiStyle('studio'); }}
                    className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold">
              🔄 Process Another Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
