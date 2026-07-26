import { useState, useRef } from 'react';
import { processProductPhoto, uploadProductPhoto, type ProcessedPhoto } from '@/lib/photoStudio';
import { Camera, Upload, Check, RefreshCw, Image } from 'lucide-react';

export default function PhotoStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setProcessing(true);
    setResult(null);
    setUploaded(false);
    try {
      const processed = await processProductPhoto(f);
      setResult(processed);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
    setProcessing(false);
  };

  const handleUpload = async () => {
    if (!result) return;
    setUploading(true);
    try {
      const urls = await uploadProductPhoto(result);
      setUploaded(true);
    } catch (e: any) {
      alert('Upload error: ' + e.message);
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-lg mx-auto p-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🖼️</div>
          <h1 className="text-2xl font-bold text-slate-800">AI Photo Studio</h1>
          <p className="text-slate-500 text-sm">Professional product photos from your phone — free!</p>
        </div>

        <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden"
               onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {!file && (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-purple-200 cursor-pointer hover:border-purple-400 transition-colors"
               onClick={() => fileRef.current?.click()}>
            <Camera size={48} className="mx-auto text-purple-400 mb-3" />
            <p className="font-medium text-purple-600">Tap to take a photo</p>
            <p className="text-xs text-slate-400 mt-1">or select from gallery</p>
          </div>
        )}

        {processing && (
          <div className="text-center py-8">
            <RefreshCw size={32} className="mx-auto text-purple-500 animate-spin mb-2" />
            <p className="text-slate-600">✨ AI is processing your photo...</p>
            <p className="text-xs text-slate-400 mt-1">Removing background, enhancing colors</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-sm text-slate-500 mb-2">Original</h3>
              <img src={result.originalUrl} alt="Original" className="w-full rounded-lg" />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-purple-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm text-purple-600">✨ Enhanced</h3>
                {uploaded && <span className="text-green-500 text-xs flex items-center gap-1"><Check size={14} /> Uploaded!</span>}
              </div>
              <img src={result.processedUrl} alt="Processed" className="w-full rounded-lg" />
              {result.processingTimeMs > 0 && (
                <p className="text-xs text-slate-400 mt-1">Processed in {(result.processingTimeMs / 1000).toFixed(1)}s</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-2 shadow-sm">
                <p className="text-xs text-slate-400 mb-1">Thumbnail</p>
                <img src={result.thumbnailUrl} alt="Thumbnail" className="w-full rounded-lg" />
              </div>
              <div className="bg-white rounded-xl p-2 shadow-sm">
                <p className="text-xs text-slate-400 mb-1">Detail View</p>
                <img src={result.detailUrl} alt="Detail" className="w-full rounded-lg" />
              </div>
            </div>
            <button onClick={handleUpload} disabled={uploading || uploaded}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
              {uploading ? <><RefreshCw size={18} className="animate-spin" /> Uploading...</> :
               uploaded ? <><Check size={18} /> Uploaded!</> :
               <><Upload size={18} /> Upload to Product</>}
            </button>
            <button onClick={() => { setFile(null); setResult(null); setUploaded(false); }}
                    className="w-full py-2 text-slate-500 text-sm">
              Process another photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
