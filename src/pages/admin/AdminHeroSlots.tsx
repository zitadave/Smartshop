import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { settingsApi } from '@/lib/api';
import { getHeroCarouselConfig, formatAdDurationLabel, DEFAULT_HERO_ADS } from '@/lib/heroAds';
import type { HeroAd } from '@/types';
import { toast } from '@/components/Toast';
import { Sparkles, Trash2, Plus, Edit3, CheckCircle, PauseCircle, Clock, ShieldCheck, DollarSign, Layers, Play } from 'lucide-react';
import { sendAdminTelegram } from '@/lib/adminNotifier';

export default function AdminHeroSlots() {
  const { settings, setSettings } = useStore();
  const config = getHeroCarouselConfig(settings);

  const [slideDuration, setSlideDuration] = useState(config.slideDuration);
  const [maxActiveAds, setMaxActiveAds] = useState(config.maxActiveAds);
  const [defaultCommissionRate, setDefaultCommissionRate] = useState(config.defaultCommissionRate);
  const [allowedDurations, setAllowedDurations] = useState<number[]>(config.allowedDurations);
  const [ads, setAds] = useState<HeroAd[]>(config.ads || DEFAULT_HERO_ADS);

  const [editingAd, setEditingAd] = useState<HeroAd | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating/editing ad
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagline, setTagline] = useState('🌟 Sponsored Feature Special');
  const [priceText, setPriceText] = useState('');
  const [ctaText, setCtaText] = useState('🛍️ Shop Now');
  const [imageUrl, setImageUrl] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [commissionRate, setCommissionRate] = useState(defaultCommissionRate);
  const [bgGradient, setBgGradient] = useState('from-[#0f172a] via-[#1e293b] to-[#334155]');
  const [vendorName, setVendorName] = useState('Smart Shop Partner');

  const saveConfig = (newAds?: HeroAd[]) => {
    const updatedAds = newAds || ads;
    const updatedSettings = {
      ...settings,
      heroCarousel: {
        slideDuration: Number(slideDuration) || 6,
        maxActiveAds: Math.max(7, Number(maxActiveAds) || 12),
        defaultCommissionRate: Number(defaultCommissionRate) || 25,
        allowedDurations,
        ads: updatedAds,
      },
    };
    setSettings(updatedSettings);
    settingsApi.update(updatedSettings);
    toast('✅ Hero Carousel & Ad Slots configuration saved!', 'success');
    sendAdminTelegram(`🌟 <b>Hero Ad Slot Settings Updated</b>\n\n💰 Commission Rate: <b>${defaultCommissionRate}%</b>\n⏱️ Slide Duration: <b>${slideDuration}s</b>\n📊 Max Active Ads: <b>${maxActiveAds}</b>\n📋 Active Slides: <b>${updatedAds.filter(a => a.status === 'active').length}</b>`);
  };

  const handleToggleDuration = (days: number) => {
    if (allowedDurations.includes(days)) {
      if (allowedDurations.length <= 1) return; // keep at least 1
      setAllowedDurations(allowedDurations.filter(d => d !== days));
    } else {
      setAllowedDurations([...allowedDurations, days].sort((a, b) => a - b));
    }
  };

  const handleOpenCreate = () => {
    setEditingAd(null);
    setTitle('');
    setSubtitle('');
    setTagline('🌟 Sponsored Feature Special');
    setPriceText('Br 1,200');
    setCtaText('🛍️ Shop Now');
    setImageUrl('/banners/banner-1.jpg');
    setDurationDays(30);
    setCommissionRate(defaultCommissionRate);
    setBgGradient('from-[#0f172a] via-[#1e293b] to-[#334155]');
    setVendorName('Smart Shop Official');
    setIsCreating(true);
  };

  const handleOpenEdit = (ad: HeroAd) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setSubtitle(ad.subtitle || '');
    setTagline(ad.tagline || '🌟 Sponsored Feature Special');
    setPriceText(ad.priceText || '');
    setCtaText(ad.ctaText || '🛍️ Shop Now');
    setImageUrl(ad.imageUrl || '');
    setDurationDays(ad.durationDays || 30);
    setCommissionRate(ad.commissionRate || defaultCommissionRate);
    setBgGradient(ad.bgGradient || 'from-[#0f172a] via-[#1e293b] to-[#334155]');
    setVendorName(ad.vendorName || 'Smart Shop Partner');
    setIsCreating(true);
  };

  const handleSaveAd = () => {
    if (!title.trim()) {
      toast('❌ Please enter a Slide Title', 'error');
      return;
    }
    let updatedAds: HeroAd[];
    if (editingAd) {
      updatedAds = ads.map(a =>
        a.id === editingAd.id
          ? {
              ...a,
              title: title.trim(),
              subtitle: subtitle.trim(),
              tagline: tagline.trim(),
              priceText: priceText.trim(),
              ctaText: ctaText.trim(),
              imageUrl: imageUrl.trim(),
              durationDays,
              commissionRate,
              bgGradient,
              vendorName: vendorName.trim(),
            }
          : a
      );
    } else {
      const newAd: HeroAd = {
        id: `hero-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        tagline: tagline.trim(),
        priceText: priceText.trim(),
        ctaText: ctaText.trim(),
        imageUrl: imageUrl.trim() || '/banners/banner-1.jpg',
        durationDays,
        commissionRate,
        bgGradient,
        vendorName: vendorName.trim(),
        status: 'active',
        startDate: new Date().toISOString(),
      };
      updatedAds = [newAd, ...ads];
    }
    setAds(updatedAds);
    saveConfig(updatedAds);
    setIsCreating(false);
    setEditingAd(null);
  };

  const handleDeleteAd = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this Hero Ad slide?')) return;
    const updatedAds = ads.filter(a => a.id !== id);
    setAds(updatedAds);
    saveConfig(updatedAds);
  };

  const handleToggleStatus = (id: string) => {
    const updatedAds = ads.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'active' ? 'paused' : 'active';
        return { ...a, status: nextStatus };
      }
      return a;
    });
    setAds(updatedAds);
    saveConfig(updatedAds);
  };

  return (
    <div className="animate-fadeUp space-y-5">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            🌟 Hero Ad Slots & Landscape Carousel Control
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Configure premium commission %, auto-slide pause duration, capacity limits (&gt;6), and vendor ad slots
          </p>
        </div>
        <button
          onClick={() => saveConfig()}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          💾 Save Configuration
        </button>
      </div>

      {/* 1. Global Monetization & Rules Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <DollarSign size={16} /> Prime Hero Ad Slot Economics & Playback Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Commission Rate */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-1.5">
            <label className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              🌟 Hero Slot Commission (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={defaultCommissionRate}
                onChange={e => setDefaultCommissionRate(Number(e.target.value))}
                min="10"
                max="60"
                className="w-20 p-2 text-sm font-extrabold bg-white dark:bg-slate-900 border border-amber-400/50 rounded-lg text-center"
              />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">% fee on sales</span>
            </div>
            <p className="text-[9px] text-amber-800/80 dark:text-amber-400/80">
              Higher commission applied to all orders referred via Hero Carousel
            </p>
          </div>

          {/* Slide Duration */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              ⏱️ Slide Pause Duration
            </label>
            <div className="flex items-center gap-2">
              <select
                value={slideDuration}
                onChange={e => setSlideDuration(Number(e.target.value))}
                className="p-2 text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-400/50 rounded-lg"
              >
                <option value={4}>4 Seconds</option>
                <option value={5}>5 Seconds</option>
                <option value={6}>6 Seconds (Recommended)</option>
                <option value={8}>8 Seconds</option>
                <option value={10}>10 Seconds</option>
              </select>
              <span className="text-xs text-slate-600 dark:text-slate-400">per slide</span>
            </div>
            <p className="text-[9px] text-indigo-800/80 dark:text-indigo-400/80">
              Auto-pauses automatically on customer touch or hover
            </p>
          </div>

          {/* Max Capacity Limit (>6) */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl space-y-1.5">
            <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              📊 Max Active Ads Limit
            </label>
            <div className="flex items-center gap-2">
              <select
                value={maxActiveAds}
                onChange={e => setMaxActiveAds(Number(e.target.value))}
                className="p-2 text-xs font-bold bg-white dark:bg-slate-900 border border-emerald-400/50 rounded-lg"
              >
                <option value={8}>8 Concurrent Slides</option>
                <option value={10}>10 Concurrent Slides</option>
                <option value={12}>12 Concurrent Slides (Default)</option>
                <option value={15}>15 Concurrent Slides</option>
                <option value={20}>20 Concurrent Slides</option>
              </select>
            </div>
            <p className="text-[9px] text-emerald-800/80 dark:text-emerald-400/80">
              Enforces more than 6 slots for vendor advertising flexibility
            </p>
          </div>
        </div>

        {/* Allowed Ad Campaign Durations Preset Pills */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            📅 Allowed Ad Campaign Durations (Days, Weeks, Months for Vendors)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { days: 3, label: '3 Days' },
              { days: 7, label: '7 Days (1 Week)' },
              { days: 14, label: '14 Days (2 Weeks)' },
              { days: 30, label: '30 Days (1 Month)' },
              { days: 90, label: '90 Days (3 Months)' },
            ].map(d => {
              const active = allowedDurations.includes(d.days);
              return (
                <button
                  key={d.days}
                  onClick={() => handleToggleDuration(d.days)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {active ? '✓ ' : ''}{d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Active Slides Manager Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Layers size={16} /> Active Landscape Hero Slides ({ads.length})
            </h3>
            <p className="text-[10px] text-slate-500">
              Manage custom banners, approve vendor Hero Ad submissions, and preview layout
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl text-xs font-black shadow hover:shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Add Hero Slide
          </button>
        </div>

        {/* Create / Edit Slide Modal or Inline Form */}
        {isCreating && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4 animate-scaleIn">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {editingAd ? `Edit Slide: ${editingAd.title}` : '➕ Create New Landscape Hero Slide'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Slide Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Ethiopian Organic Coffee 1kg"
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. 100% Yirgacheffe Beans • Free Delivery"
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Top Tagline Badge</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="🌟 Sponsored Feature Special"
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Price Text Badge</label>
                <input
                  type="text"
                  value={priceText}
                  onChange={e => setPriceText(e.target.value)}
                  placeholder="Br 800 (Standard Br 950)"
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={e => setCtaText(e.target.value)}
                  placeholder="🛍️ Shop Now"
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Banner Image URL *</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="e.g. /banners/banner-1.jpg or https://..."
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Vendor Name Attribution</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  placeholder="Smart Shop Partner"
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Campaign Duration</label>
                <select
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900 font-bold"
                >
                  {allowedDurations.map(d => (
                    <option key={d} value={d}>{formatAdDurationLabel(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Banner Background Theme</label>
                <select
                  value={bgGradient}
                  onChange={e => setBgGradient(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-slate-900"
                >
                  <option value="from-[#0f172a] via-[#1e293b] to-[#334155]">Midnight Slate</option>
                  <option value="from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]">Royal Sapphire Blue</option>
                  <option value="from-[#7c2d12] via-[#9a3412] to-[#ea580c]">Warm Sunset Amber</option>
                  <option value="from-[#065f46] via-[#059669] to-[#10b981]">Emerald Forest Green</option>
                  <option value="from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]">Imperial Violet Purple</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveAd}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                💾 Save Slide
              </button>
              <button
                onClick={() => { setIsCreating(false); setEditingAd(null); }}
                className="px-4 py-2 border rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Slides Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-3 font-semibold">Hero Slide</th>
                <th className="pb-3 font-semibold">Tagline / Price</th>
                <th className="pb-3 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Commission</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ads.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ad.bgGradient || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                        🌟
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {ad.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {ad.subtitle || ad.vendorName || 'Smart Shop'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-[10px] font-bold text-amber-600 block">
                      {ad.tagline || 'Sponsored'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {ad.priceText || 'Standard'}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                      <Clock size={11} /> {formatAdDurationLabel(ad.durationDays || 30)}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-extrabold text-emerald-600">
                    {ad.commissionRate || defaultCommissionRate}%
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(ad.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ad.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {ad.status === 'active' ? (
                        <>
                          <CheckCircle size={11} /> Active
                        </>
                      ) : (
                        <>
                          <PauseCircle size={11} /> Paused
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(ad)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Edit Slide"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Slide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
