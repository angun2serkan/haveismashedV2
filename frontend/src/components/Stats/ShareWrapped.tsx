import { useState, useRef, useMemo, useEffect } from "react";
import html2canvas from "html2canvas";
import { WrappedCard } from "./WrappedCard";
import { useLogStore } from "@/stores/logStore";
import { useAuthStore } from "@/stores/authStore";
import { getCountryName } from "@/utils/countryName";
import { api } from "@/services/api";
import type { Badge } from "@/types";
import { Check, Copy } from "lucide-react";

export function ShareWrapped() {
  const stats = useLogStore((s) => s.stats);
  const dates = useLogStore((s) => s.dates);
  const user = useAuthStore((s) => s.user);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [copied, setCopied] = useState(false);

  // Detect mobile device (native share with files only works reliably on mobile)
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    api.getMyBadges().then(setBadges).catch(() => {});
  }, []);

  // Compute top city from dates
  const topCity = useMemo(() => {
    const counts: Record<string, number> = {};
    dates.forEach((d) => {
      if (d.cityName) counts[d.cityName] = (counts[d.cityName] ?? 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? null;
  }, [dates]);

  // Compute top country from dates
  const topCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    dates.forEach((d) => {
      counts[d.countryCode] = (counts[d.countryCode] ?? 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const code = entries[0]?.[0];
    return code ? getCountryName(code) : null;
  }, [dates]);

  // Find highest-tier earned badge
  const topBadgeInfo = useMemo(() => {
    const earned = badges.filter((b) => b.earned);
    if (earned.length === 0) return null;
    const tierOrder: Record<string, number> = { gold: 3, silver: 2, bronze: 1 };
    earned.sort((a, b) => (tierOrder[b.tier] ?? 0) - (tierOrder[a.tier] ?? 0));
    const best = earned[0];
    return best ? { icon: best.icon, name: best.name } : null;
  }, [badges]);

  const handleGenerate = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const url = canvas.toDataURL("image/png");
      setPreviewUrl(url);
    } finally {
      setGenerating(false);
    }
  };

  const shareText = "Check out my dating stats on havesmashed! 🔥";

  const getImageBlob = async () => {
    if (!previewUrl) return null;
    const response = await fetch(previewUrl);
    return response.blob();
  };

  const copyToClipboard = async () => {
    const blob = await getImageBlob();
    if (!blob) return false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  };

  const downloadImage = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "havesmashed-wrapped.png";
    a.click();
  };

  const handleShareNative = async () => {
    const blob = await getImageBlob();
    if (!blob) return false;
    const file = new File([blob], "havesmashed-wrapped.png", { type: "image/png" });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "My havesmashed Wrapped",
        text: shareText,
        files: [file],
      });
      return true;
    }
    return false;
  };

  const shareTo = async (platformUrl?: string) => {
    // Mobile: use native share sheet
    if (await handleShareNative()) return;
    // Desktop: copy image to clipboard, then open platform
    await copyToClipboard();
    if (platformUrl) window.open(platformUrl, "_blank");
  };

  const handleInstagram = () =>
    shareTo("https://www.instagram.com/");

  const handleTwitter = () =>
    shareTo(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);

  const handleTikTok = () =>
    shareTo("https://www.tiktok.com/upload");

  const handleWhatsApp = () =>
    shareTo(`https://web.whatsapp.com/`);

  const handleTelegram = () =>
    shareTo(`https://web.telegram.org/`);

  return (
    <>
      {/* Hidden card for rendering */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={cardRef}>
          <WrappedCard
            nickname={user?.nickname ?? "anonymous"}
            stats={stats}
            topCity={topCity}
            topCountry={topCountry}
            dateCount={stats.totalDates}
            topBadge={topBadgeInfo?.icon}
            topBadgeName={topBadgeInfo?.name}
            streak={stats.currentStreak}
          />
        </div>
      </div>

      {/* Button + Preview */}
      {!previewUrl ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer
            bg-neon-500 text-white hover:bg-neon-400 glow-sm hover:glow-md active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "Generating..." : "Share My Stats"}
        </button>
      ) : (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="Wrapped"
            className="w-full max-w-sm mx-auto rounded-xl border border-dark-700"
          />
          {/* Clipboard status banner */}
          {copied && (
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-green-500/10 border border-green-500/30 animate-in fade-in duration-200">
              <Check size={14} className="text-green-400" />
              <span className="text-xs text-green-400 font-medium">
                Görsel panoya kopyalandı
              </span>
            </div>
          )}

          {/* Mobile app: social share buttons + utility row */}
          {isMobile ? (
            <>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={handleInstagram}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all duration-200 cursor-pointer"
                  style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram
                </button>
                <button
                  onClick={handleTwitter}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-black active:scale-95 transition-all duration-200 cursor-pointer border border-dark-600"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </button>
                <button
                  onClick={handleTikTok}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-black active:scale-95 transition-all duration-200 cursor-pointer border border-dark-600"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.78V6.69z"/></svg>
                  TikTok
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button
                  onClick={handleTelegram}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: "#0088cc" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-neon-400 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? "Kopyalandı" : "Panoya Kopyala"}
                </button>
                <span className="text-dark-600">|</span>
                <button
                  onClick={downloadImage}
                  className="text-xs text-dark-300 hover:text-neon-400 transition-colors cursor-pointer"
                >
                  Kaydet
                </button>
                <span className="text-dark-600">|</span>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="text-xs text-dark-300 hover:text-neon-400 transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </>
          ) : (
            /* Desktop browser: only copy + download */
            <div className="flex gap-2 justify-center">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-neon-500 text-white hover:bg-neon-400 glow-sm active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Kopyalandı" : "Panoya Kopyala"}
              </button>
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-dark-700 text-dark-100 border border-dark-500 hover:border-neon-500 hover:text-neon-400 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Kaydet
              </button>
              <button
                onClick={() => setPreviewUrl(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-dark-300 hover:text-neon-400 hover:bg-dark-800 transition-all duration-200 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
