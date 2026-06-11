import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { haptics } from './haptics';
import type { Quote } from '../types';

/**
 * Legacy DOM-capture share (kept for MilestoneCelebration etc.)
 */
export const shareElementAsImage = async (
    elementId: string,
    fileName: string,
    shareTitle: string,
    shareText: string
) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID ${elementId} not found.`);
        return;
    }

    try {
        haptics.light();

        const canvas = await html2canvas(element, {
            useCORS: true,
            scale: 2,
            backgroundColor: null,
            logging: false
        });

        const base64Data = canvas.toDataURL('image/png').split(',')[1];
        const fileNameWithExt = `${fileName}_${Date.now()}.png`;

        const savedFile = await Filesystem.writeFile({
            path: fileNameWithExt,
            data: base64Data,
            directory: Directory.Cache
        });

        await Share.share({
            title: shareTitle,
            text: shareText,
            files: [savedFile.uri],
            dialogTitle: shareTitle
        });

        haptics.success();
    } catch (error) {
        console.error('Failed to share image:', error);
        haptics.error();
        try {
            await Share.share({ title: shareTitle, text: shareText });
        } catch { /* silence */ }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based quote share image
// Draws directly via Canvas 2D API — no html2canvas, no DOM capture,
// works 100% reliably in Capacitor/WKWebView.
// ─────────────────────────────────────────────────────────────────────────────

// Deterministic PRNG — same algorithm as DashboardQuoteCard + SharedQuotePreview
const getRand = (s: string, i: number): number => {
    let hash = 0;
    for (let j = 0; j < s.length; j++) hash = ((hash << 5) - hash) + s.charCodeAt(j);
    const x = Math.sin(hash + i) * 10000;
    return x - Math.floor(x);
};

// Earthy palette — matches the home card exactly
const COLORS = ['#F59E0B', '#E5D6A7', '#C96A3A', '#415D43', '#879582'];

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Generates a 1080×1920 quote share image using the Canvas 2D API.
 * Returns a JPEG data-URL (base64 encoded).
 */
export async function generateShareImage(quote: Quote, seed: string): Promise<string> {
    // Pre-load fonts + logo image in parallel
    const logoPromise = new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = '/logo-gold.png';
    });

    try {
        await Promise.all([
            document.fonts.load('600 80px Poppins'),
            document.fonts.load('700 44px Poppins'),
            document.fonts.load('500 26px Inter'),
            document.fonts.load('800 30px Inter'),
            document.fonts.load('600 20px Inter'),
        ]);
    } catch { /* no network — falls back to system sans-serif */ }
    await document.fonts.ready;
    const logoImg = await logoPromise;

    const W = 1080;
    const H = 1920;

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── 1. Background ────────────────────────────────────────────────────────
    ctx.fillStyle = '#415D43';
    ctx.fillRect(0, 0, W, H);

    // Seed-driven base colour tint (matches DashboardQuoteCard)
    const baseColor = COLORS[Math.floor(getRand(seed, 0) * COLORS.length)];
    ctx.globalAlpha = 0.85;
    ctx.fillStyle   = baseColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // Art blobs — scaled from the 400×520 SVG viewBox to 1080×1920
    for (let i = 1; i <= 5; i++) {
        const cx    = 50  + getRand(seed, i * 10) * 980;
        const cy    = 50  + getRand(seed, i * 20) * 1820;
        const r     = 400 + getRand(seed, i * 30) * 600;
        const color = COLORS[Math.floor(getRand(seed, i * 40) * COLORS.length)];
        const alpha = Math.max(0, Math.min(1, 0.18 + getRand(seed, i * 50) * 0.22));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── 2. Measure text to size the white card ───────────────────────────────
    const isTierQuote =
        quote.author === 'Muse'          ||
        quote.author === 'Focus'         ||
        quote.author === 'Fire'          ||
        quote.author === 'Palante' ||
        quote.author === 'Palante Coach' || // legacy attribution on data saved before the rename
        !!(quote as { isAI?: boolean }).isAI;

    const len      = quote.text.length;
    const fontSize = len > 200 ? 42
                   : len > 160 ? 48
                   : len > 120 ? 54
                   : len > 80  ? 64
                   : len > 50  ? 76
                   :             84;
    const lineH = Math.round(fontSize * (len > 120 ? 1.45 : 1.35));

    const CARD_MX  = 100;   // card left/right margin
    const CARD_PX  = 80;    // text left/right padding inside card
    const CARD_PT  = 160;   // top padding inside card (room for badge)
    const CARD_PB  = 100;   // bottom padding inside card
    const cardW    = W - CARD_MX * 2;
    const textMaxW = cardW  - CARD_PX * 2;

    ctx.font = `600 ${fontSize}px Poppins, sans-serif`;
    const lines = wrapText(ctx, quote.text, textMaxW);

    const quoteBlockH  = lines.length * lineH;
    const authorGap    = 48;
    const authorBlockH = isTierQuote ? 0 : authorGap + 46; // gap + divider + name
    const cardH        = CARD_PT + quoteBlockH + authorBlockH + CARD_PB;
    const cardY        = Math.round((H - cardH) / 2);

    // ── 3. Card drop shadow ──────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur    = 90;
    ctx.shadowOffsetY = 40;
    ctx.fillStyle     = '#FDFBF7';
    roundedRect(ctx, CARD_MX, cardY, cardW, cardH, 48);
    ctx.fill();
    ctx.restore();

    // ── 4. Card fill ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#FDFBF7';
    roundedRect(ctx, CARD_MX, cardY, cardW, cardH, 48);
    ctx.fill();

    // ── 5. Logo badge — dark-green circle overlapping top of card (matches preview) ──
    const badgeR  = 54;
    const badgeCX = W / 2;
    const badgeCY = cardY;

    // Drop shadow
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur    = 28;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#355E3B';
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Badge fill — dark green to match SharedQuotePreview
    ctx.fillStyle = '#355E3B';
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fill();

    // Logo image centered inside badge — preserve natural aspect ratio so it never squishes
    if (logoImg && logoImg.naturalWidth > 0) {
        const maxLogoSize = badgeR * 1.05;
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const drawW = aspect >= 1 ? maxLogoSize : maxLogoSize * aspect;
        const drawH = aspect >= 1 ? maxLogoSize / aspect : maxLogoSize;
        ctx.drawImage(logoImg, badgeCX - drawW / 2, badgeCY - drawH / 2, drawW, drawH);
    } else {
        // Fallback: pale-gold "P" if image failed to load
        ctx.font         = '700 52px Poppins, sans-serif';
        ctx.fillStyle    = '#E5D6A7';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', badgeCX, badgeCY + 2);
    }


    // ── 6. Quote text ────────────────────────────────────────────────────────
    ctx.font         = `600 ${fontSize}px Poppins, sans-serif`;
    ctx.fillStyle    = '#2D3E33';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    let textY = cardY + CARD_PT;
    for (const line of lines) {
        ctx.fillText(line, W / 2, textY);
        textY += lineH;
    }

    // ── 7. Author attribution ────────────────────────────────────────────────
    if (!isTierQuote) {
        const dividerY = textY + authorGap;

        // Divider line
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#879582';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 40, dividerY);
        ctx.lineTo(W / 2 + 40, dividerY);
        ctx.stroke();
        ctx.restore();

        // Author name
        ctx.font         = '500 26px Inter, sans-serif';
        ctx.fillStyle    = '#879582';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(quote.author.toUpperCase(), W / 2, dividerY + 20);
    }

    // ── 8. Branding — sits directly below the quote card so it's never cropped ──
    const brandingY = cardY + cardH + 52;

    ctx.font         = '600 22px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(253,251,247,0.5)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('FORWARD, TOGETHER — EVERY SINGLE DAY', W / 2, brandingY);

    ctx.font      = '800 34px Inter, sans-serif';
    ctx.fillStyle = 'rgba(253,251,247,0.88)';
    ctx.fillText('@PALANTE.APP', W / 2, brandingY + 46);

    // JPEG 92% — smaller than PNG, perfect for social upload
    return canvas.toDataURL('image/jpeg', 0.92);
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly reflection share image
// Same visual language as generateShareImage (blobs, parchment card, logo badge)
// but shows the AI "Your week, reflected" paragraph instead of a quote.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a 1080×1920 weekly reflection share image.
 * Same earthy blob background as the quote card. Returns a JPEG data-URL.
 */
export async function generateWeeklyReflectionShareImage(
    reflectionText: string,
    dateRange: string,       // e.g. "Apr 28 – May 4"
    seed: string,            // e.g. "weekly-2026-W19"
): Promise<string> {
    const logoPromise = new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = '/logo-gold.png';
    });

    try {
        await Promise.all([
            document.fonts.load('600 80px Poppins'),
            document.fonts.load('700 44px Poppins'),
            document.fonts.load('500 26px Inter'),
            document.fonts.load('800 30px Inter'),
            document.fonts.load('600 20px Inter'),
        ]);
    } catch { /* fallback to system sans-serif */ }
    await document.fonts.ready;
    const logoImg = await logoPromise;

    const W = 1080;
    const H = 1920;

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── 1. Background — same earthy blob treatment as quote card ────────────
    ctx.fillStyle = '#415D43';
    ctx.fillRect(0, 0, W, H);

    const baseColor = COLORS[Math.floor(getRand(seed, 0) * COLORS.length)];
    ctx.globalAlpha = 0.85;
    ctx.fillStyle   = baseColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    for (let i = 1; i <= 5; i++) {
        const cx    = 50  + getRand(seed, i * 10) * 980;
        const cy    = 50  + getRand(seed, i * 20) * 1820;
        const r     = 400 + getRand(seed, i * 30) * 600;
        const color = COLORS[Math.floor(getRand(seed, i * 40) * COLORS.length)];
        const alpha = Math.max(0, Math.min(1, 0.18 + getRand(seed, i * 50) * 0.22));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── 2. Measure wrapped reflection text to size the card ─────────────────
    const CARD_MX  = 100;
    const CARD_PX  = 80;
    const CARD_PT  = 180;   // Extra top room for logo badge + "YOUR WEEK, REFLECTED" label
    const CARD_PB  = 120;
    const cardW    = W - CARD_MX * 2;
    const textMaxW = cardW - CARD_PX * 2;

    const fontSize = reflectionText.length > 200 ? 38 : reflectionText.length > 140 ? 44 : 50;
    const lineH    = Math.round(fontSize * 1.6);

    ctx.font = `600 ${fontSize}px Poppins, sans-serif`;
    const lines = wrapText(ctx, reflectionText, textMaxW);

    const labelBlockH  = 60;   // "YOUR WEEK, REFLECTED" label
    const textBlockH   = lines.length * lineH;
    const dividerGap   = 60;
    const dateBlockH   = 44;
    const cardH        = CARD_PT + labelBlockH + textBlockH + dividerGap + dateBlockH + CARD_PB;
    const cardY        = Math.round((H - cardH) / 2);

    // ── 3. Card shadow + fill ────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur    = 90;
    ctx.shadowOffsetY = 40;
    ctx.fillStyle     = '#FDFBF7';
    roundedRect(ctx, CARD_MX, cardY, cardW, cardH, 48);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FDFBF7';
    roundedRect(ctx, CARD_MX, cardY, cardW, cardH, 48);
    ctx.fill();

    // ── 4. Logo badge — identical to generateShareImage ─────────────────────
    const badgeR  = 54;
    const badgeCX = W / 2;
    const badgeCY = cardY;

    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur    = 28;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#355E3B';
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#355E3B';
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fill();

    if (logoImg && logoImg.naturalWidth > 0) {
        const maxLogoSize = badgeR * 1.05;
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const drawW = aspect >= 1 ? maxLogoSize : maxLogoSize * aspect;
        const drawH = aspect >= 1 ? maxLogoSize / aspect : maxLogoSize;
        ctx.drawImage(logoImg, badgeCX - drawW / 2, badgeCY - drawH / 2, drawW, drawH);
    } else {
        ctx.font = '700 52px Poppins, sans-serif';
        ctx.fillStyle = '#E5D6A7';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', badgeCX, badgeCY + 2);
    }

    // ── 5. "YOUR WEEK, REFLECTED" label ─────────────────────────────────────
    ctx.font         = '700 26px Inter, sans-serif';
    ctx.fillStyle    = '#C96A3A';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('YOUR WEEK, REFLECTED', W / 2, cardY + CARD_PT);

    // ── 6. Reflection text (italic Poppins) ──────────────────────────────────
    ctx.font         = `600 ${fontSize}px Poppins, sans-serif`;
    ctx.fillStyle    = '#2D3E33';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    let textY = cardY + CARD_PT + labelBlockH;
    for (const line of lines) {
        ctx.fillText(line, W / 2, textY);
        textY += lineH;
    }

    // ── 7. Terracotta divider + date range ───────────────────────────────────
    const dividerY = textY + dividerGap / 2;
    ctx.save();
    ctx.strokeStyle = '#C96A3A';
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 50, dividerY);
    ctx.lineTo(W / 2 + 50, dividerY);
    ctx.stroke();
    ctx.restore();

    ctx.font         = '600 28px Inter, sans-serif';
    ctx.fillStyle    = '#879582';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(dateRange.toUpperCase(), W / 2, dividerY + 28);

    // ── 8. Branding — same position as quote card ────────────────────────────
    const brandingY = cardY + cardH + 52;

    ctx.font         = '600 22px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(253,251,247,0.5)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('FORWARD, TOGETHER — EVERY SINGLE DAY', W / 2, brandingY);

    ctx.font      = '800 34px Inter, sans-serif';
    ctx.fillStyle = 'rgba(253,251,247,0.88)';
    ctx.fillText('@PALANTE.APP', W / 2, brandingY + 46);

    return canvas.toDataURL('image/jpeg', 0.92);
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas-based milestone share image
// Replaces html2canvas capture — works reliably in Capacitor/WKWebView.
// ─────────────────────────────────────────────────────────────────────────────

function drawTrophyOnCanvas(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, size: number,
) {
    const s = size;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#E5D6A7';
    ctx.lineWidth = s * 0.045;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Cup body
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, -s * 0.42);
    ctx.lineTo(s * 0.38, -s * 0.42);
    ctx.lineTo(s * 0.26, s * 0.08);
    ctx.quadraticCurveTo(s * 0.22, s * 0.22, 0, s * 0.24);
    ctx.quadraticCurveTo(-s * 0.22, s * 0.22, -s * 0.26, s * 0.08);
    ctx.closePath();
    ctx.fillStyle = 'rgba(229,214,167,0.12)';
    ctx.fill();
    ctx.stroke();

    // Left handle
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, -s * 0.30);
    ctx.bezierCurveTo(-s * 0.55, -s * 0.30, -s * 0.55, s * 0.04, -s * 0.38, s * 0.04);
    ctx.stroke();

    // Right handle
    ctx.beginPath();
    ctx.moveTo(s * 0.38, -s * 0.30);
    ctx.bezierCurveTo(s * 0.55, -s * 0.30, s * 0.55, s * 0.04, s * 0.38, s * 0.04);
    ctx.stroke();

    // Stem
    ctx.beginPath();
    ctx.moveTo(-s * 0.07, s * 0.24);
    ctx.lineTo(-s * 0.07, s * 0.38);
    ctx.lineTo(s * 0.07, s * 0.38);
    ctx.lineTo(s * 0.07, s * 0.24);
    ctx.stroke();

    // Base
    ctx.lineWidth = s * 0.065;
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, s * 0.38);
    ctx.lineTo(s * 0.28, s * 0.38);
    ctx.stroke();

    ctx.restore();
}

export async function generateMilestoneShareImage(params: {
    title: string;
    label: string;
    count: number;
    message: string;
    iconName: string;
}): Promise<string> {
    const { title, label, count, message } = params;

    try {
        await Promise.all([
            document.fonts.load('700 96px Poppins'),
            document.fonts.load('600 80px Poppins'),
            document.fonts.load('700 36px Inter'),
            document.fonts.load('500 40px Inter'),
        ]);
    } catch { /* no-op */ }
    await document.fonts.ready;

    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Background ───────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bgGrad.addColorStop(0, '#1B4332');
    bgGrad.addColorStop(1, '#252E22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Soft ambient blob
    const blob = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, 520);
    blob.addColorStop(0, 'rgba(229,214,167,0.07)');
    blob.addColorStop(1, 'rgba(229,214,167,0)');
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, W, H);

    // ── Card ─────────────────────────────────────────────────────────────────
    const cardMX = 80;
    const cardW  = W - cardMX * 2;
    const cardR  = 60;

    // Pre-measure text to size the card dynamically
    ctx.font = '700 84px Poppins, sans-serif';
    const titleLines = wrapText(ctx, title, cardW - 120);
    ctx.font = 'italic 500 42px Poppins, sans-serif';
    const msgLines = wrapText(ctx, `"${message}"`, cardW - 160);

    const iconBoxH = 220;
    const titleBlockH = titleLines.length * 100;
    const cardPadT  = 80;
    const cardPadB  = 80;
    const countBoxH = 150;
    const msgBlockH = msgLines.length * 58;
    const brandH    = 80;
    const cardH = cardPadT + iconBoxH + 40 + titleBlockH + 36 + 50 + 40 + countBoxH + 48 + msgBlockH + 48 + brandH + cardPadB;
    const cardY = Math.round((H - cardH) / 2);

    // Shadow
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur    = 80;
    ctx.shadowOffsetY = 30;
    ctx.fillStyle     = 'rgba(255,255,255,0.065)';
    roundedRect(ctx, cardMX, cardY, cardW, cardH, cardR);
    ctx.fill();
    ctx.restore();

    // Card fill + border
    ctx.fillStyle   = 'rgba(255,255,255,0.065)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth   = 1.5;
    roundedRect(ctx, cardMX, cardY, cardW, cardH, cardR);
    ctx.fill();
    ctx.stroke();

    let cursor = cardY + cardPadT;

    // ── Icon box ─────────────────────────────────────────────────────────────
    const iconBoxSize = 200;
    const iconBoxX    = W / 2 - iconBoxSize / 2;
    ctx.fillStyle   = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth   = 1.5;
    roundedRect(ctx, iconBoxX, cursor, iconBoxSize, iconBoxSize, 44);
    ctx.fill();
    ctx.stroke();
    drawTrophyOnCanvas(ctx, W / 2, cursor + iconBoxSize / 2, 84);
    cursor += iconBoxH + 40;

    // ── Title ─────────────────────────────────────────────────────────────────
    ctx.font         = '700 84px Poppins, sans-serif';
    ctx.fillStyle    = '#FFFFFF';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    for (const line of titleLines) {
        ctx.fillText(line, W / 2, cursor);
        cursor += 100;
    }

    // ── Milestone tag ─────────────────────────────────────────────────────────
    cursor += 16;
    ctx.font         = '700 28px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(229,214,167,0.60)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PALANTE  MILESTONE', W / 2, cursor);
    cursor += 50 + 40;

    // ── Count box ────────────────────────────────────────────────────────────
    const countMX = cardMX + 60;
    ctx.fillStyle   = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth   = 1.5;
    roundedRect(ctx, countMX, cursor, W - countMX * 2, countBoxH, 40);
    ctx.fill();
    ctx.stroke();

    const countCY = cursor + countBoxH / 2;

    // Count number (left-center)
    ctx.font         = '500 110px Poppins, sans-serif';
    ctx.fillStyle    = '#E5D6A7';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(count), W / 2 - 20, countCY);

    // Label + "Achieved" (right-center)
    ctx.font         = '700 34px Inter, sans-serif';
    ctx.fillStyle    = '#FFFFFF';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.toUpperCase(), W / 2 + 28, countCY - 22);
    ctx.font         = '500 26px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.40)';
    ctx.fillText('ACHIEVED', W / 2 + 28, countCY + 22);

    cursor += countBoxH + 48;

    // ── Message ───────────────────────────────────────────────────────────────
    ctx.font         = 'italic 500 42px Poppins, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.78)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    for (const line of msgLines) {
        ctx.fillText(line, W / 2, cursor);
        cursor += 58;
    }

    cursor += 48;

    // ── Branding ──────────────────────────────────────────────────────────────
    const brandR = 22;
    ctx.fillStyle = '#E5D6A7';
    ctx.beginPath();
    ctx.arc(W / 2 - 70, cursor + brandR, brandR, 0, Math.PI * 2);
    ctx.fill();
    ctx.font         = '800 22px Inter, sans-serif';
    ctx.fillStyle    = '#1B4332';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', W / 2 - 70, cursor + brandR + 1);

    ctx.font         = '700 30px Inter, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.50)';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('PALANTE', W / 2 - 36, cursor + brandR);

    return canvas.toDataURL('image/jpeg', 0.92);
}

export async function saveMilestoneToPhotos(params: {
    title: string;
    label: string;
    count: number;
    message: string;
    iconName: string;
}): Promise<void> {
    haptics.light();
    try {
        const dataUrl = await generateMilestoneShareImage({ ...params, shareText: '' });
        const base64  = dataUrl.split(',')[1];
        const fileName = `palante_milestone_${Date.now()}.jpg`;

        const saved = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
        });

        // iOS: share sheet with file — user taps "Save Image" to send to Camera Roll
        await Share.share({
            title: params.title,
            text: 'Save your Palante milestone',
            files: [saved.uri],
            dialogTitle: 'Save to Camera Roll',
        });

        haptics.success();
    } catch (err) {
        console.error('Milestone save failed:', err);
        haptics.error();
    }
}

export async function shareMilestoneAsImage(params: {
    title: string;
    label: string;
    count: number;
    message: string;
    iconName: string;
    shareText: string;
}): Promise<void> {
    haptics.light();
    try {
        const dataUrl = await generateMilestoneShareImage(params);
        const base64  = dataUrl.split(',')[1];
        const fileName = `palante_milestone_${Date.now()}.jpg`;

        const saved = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
        });

        await Share.share({
            title: params.title,
            text:  params.shareText,
            files: [saved.uri],
            dialogTitle: params.title,
        });

        haptics.success();
    } catch (err) {
        console.error('Milestone share failed:', err);
        haptics.error();
        try {
            await Share.share({ title: params.title, text: params.shareText });
        } catch { /* silence */ }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak share card — captures #streak-share-card via html2canvas at 5.4×
// scale to produce a ~1080×1922 image from the 200×356 SharedStreakCard div.
// This preserves the real mandala with the user's actual earned petals.
// ─────────────────────────────────────────────────────────────────────────────

async function captureStreakCardAsBase64(): Promise<{ base64: string; fileName: string }> {
    const element = document.getElementById('streak-share-card');
    if (!element) throw new Error('streak-share-card element not found');

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 5.4,
        backgroundColor: null,
        logging: false,
    });

    const base64 = canvas.toDataURL('image/jpeg', 0.93).split(',')[1];
    const fileName = `palante_streak_${Date.now()}.jpg`;
    return { base64, fileName };
}

export async function shareStreakCard(params: { streak: number }): Promise<void> {
    haptics.light();
    try {
        const { base64, fileName } = await captureStreakCardAsBase64();

        const saved = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
        });

        const { streak } = params;
        const shareText = `${streak} day${streak !== 1 ? 's' : ''} and counting. Growing with Palante.\npalante.app`;

        await Share.share({
            title:       'My Palante Streak',
            text:        shareText,
            files:       [saved.uri],
            dialogTitle: 'Share your streak',
        });

        haptics.success();
    } catch (err) {
        console.error('Streak share failed:', err);
        haptics.error();
        try {
            const { streak } = params;
            await Share.share({
                title: 'My Palante Streak',
                text:  `${streak} day${streak !== 1 ? 's' : ''} and counting. Growing with Palante.`,
            });
        } catch { /* silence */ }
    }
}

export async function downloadStreakCard(): Promise<void> {
    haptics.light();
    try {
        const { base64, fileName } = await captureStreakCardAsBase64();

        const saved = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
        });

        await Share.share({
            title:       'My Palante Streak',
            text:        'Save your streak card',
            files:       [saved.uri],
            dialogTitle: 'Save to Camera Roll',
        });

        haptics.success();
    } catch (err) {
        console.error('Streak download failed:', err);
        haptics.error();
    }
}
