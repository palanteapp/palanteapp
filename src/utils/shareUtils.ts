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
    // Cap radius so corners never overlap — beyond half the shortest side produces sharp artifacts
    r = Math.min(r, w / 2, h / 2);
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
    ctx.font = '500 42px Poppins, sans-serif';
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
    ctx.font         = '500 42px Poppins, sans-serif';
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
        const dataUrl = await generateMilestoneShareImage(params);
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
// Streak share card — drawn entirely with Canvas 2D (no html2canvas).
// html2canvas fails silently on elements inside position:fixed modals in
// WKWebView, which is exactly where SharedStreakCard lives. Direct canvas
// drawing is the only reliable path.
// ─────────────────────────────────────────────────────────────────────────────

// Full palette per cycle — mirrors SharedStreakCard's BG_COLORS exactly
const STREAK_CARD_PAL = [
    { bg0: '#1A3320', bg1: '#243D2A', T: '#C96A3A', G: '#E5D6A7', S: '#415D43', story0: '#1A3320', story1: '#0F1E13' },
    { bg0: '#12103A', bg1: '#1A1B42', T: '#6B4FBB', G: '#C5C0F0', S: '#2D3E6B', story0: '#12103A', story1: '#0A0922' },
    { bg0: '#2A1E04', bg1: '#2C220A', T: '#C89030', G: '#F5E8B0', S: '#5C4A10', story0: '#2A1E04', story1: '#1A1202' },
    { bg0: '#2A0A14', bg1: '#2C101A', T: '#C95080', G: '#F0C8D8', S: '#6B2A3A', story0: '#2A0A14', story1: '#1A060C' },
] as const;

function hexAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
    });
}

async function generateStreakStoryImage(params: {
    streak: number;
    totalPractices: number;
    colorCycle: number;
    firstName?: string;
}): Promise<{ base64: string; fileName: string }> {
    const { streak, totalPractices, colorCycle, firstName } = params;
    const pal = STREAK_CARD_PAL[colorCycle % STREAK_CARD_PAL.length];

    const completedDays = totalPractices > 0 && totalPractices % 90 === 0 ? 90 : totalPractices % 90;
    const outerPetals   = Math.max(0, completedDays - 1);
    const remaining     = 90 - completedDays;
    const cycle         = Math.floor(totalPractices / 90);
    const streakLabel   = streak === 1 ? '1 day' : `${streak} days`;
    const progressLine  = outerPetals === 0
        ? `Garden started · ${remaining} petals to full bloom${cycle > 0 ? ` · cycle ${cycle + 1}` : ''}`
        : `${outerPetals} petal${outerPetals !== 1 ? 's' : ''} earned · ${remaining} to full bloom${cycle > 0 ? ` · cycle ${cycle + 1}` : ''}`;

    // Canvas — 1080×1920 Instagram Stories format
    const W = 1080, H = 1920;
    // Card is 3× the 200×356 CSS card
    const CW = 600, CH = 1068, CR = 48;
    // Center in the safe zone: keep bottom 520px free for Instagram's chrome
    const CX = Math.round((W - CW) / 2);
    const CY = Math.round(Math.max(80, ((H - 520) - CH) / 2));

    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    try {
        await Promise.all([
            document.fonts.load('700 21px Inter'),
            document.fonts.load('700 36px Poppins'),
            document.fonts.load('700 21px Poppins'),
            document.fonts.load('500 18px Inter'),
            document.fonts.load('500 14px Inter'),
        ]);
    } catch { /* system fallback */ }
    await document.fonts.ready;

    // ── Story background ─────────────────────────────────────────────────────
    const glowCY = CY + CH * 0.37;
    const bg = ctx.createRadialGradient(W / 2, glowCY, 0, W / 2, glowCY, H * 0.65);
    bg.addColorStop(0, pal.story0);
    bg.addColorStop(1, pal.story1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const vign = ctx.createRadialGradient(W / 2, CY + CH / 2, H * 0.2, W / 2, CY + CH / 2, H * 0.7);
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    // ── Card shadow + fill ───────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur    = 60;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle     = pal.bg0;
    roundedRect(ctx, CX, CY, CW, CH, CR);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = pal.bg0;
    roundedRect(ctx, CX, CY, CW, CH, CR);
    ctx.fill();

    // Ambient glow clipped to card
    ctx.save();
    roundedRect(ctx, CX, CY, CW, CH, CR);
    ctx.clip();
    const mandalaGlowCY = CY + 144 + 315; // mandala visual centre
    const glow = ctx.createRadialGradient(W / 2, mandalaGlowCY, 0, W / 2, mandalaGlowCY, CW * 0.55);
    glow.addColorStop(0, hexAlpha(pal.T, 0.16));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(CX, CY, CW, CH);
    ctx.restore();

    // ── Streak badge pill ────────────────────────────────────────────────────
    ctx.font = '700 21px Inter, sans-serif';
    const labelW = ctx.measureText('STREAK').width;
    ctx.font = '700 36px Poppins, sans-serif';
    const daysW = ctx.measureText(streakLabel).width;

    const PILL_PAD = 42, GAP = 24, DIV_W = 3, PILL_H = 52;
    const PILL_W   = PILL_PAD + labelW + GAP + DIV_W + GAP + daysW + PILL_PAD;
    const PILL_TOP = CY + 36;
    const PILL_X   = Math.round(CX + CW / 2 - PILL_W / 2);

    ctx.fillStyle   = hexAlpha(pal.T, 0.07);
    ctx.strokeStyle = hexAlpha(pal.T, 0.5);
    ctx.lineWidth   = 4.5;
    roundedRect(ctx, PILL_X, PILL_TOP, PILL_W, PILL_H, 72);
    ctx.fill();
    ctx.stroke();

    ctx.font         = '700 21px Inter, sans-serif';
    ctx.fillStyle    = pal.T;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('STREAK', PILL_X + PILL_PAD, PILL_TOP + PILL_H / 2);

    const divX = PILL_X + PILL_PAD + labelW + GAP;
    ctx.save();
    ctx.globalAlpha  = 0.3;
    ctx.strokeStyle  = pal.G;
    ctx.lineWidth    = 3;
    ctx.beginPath();
    ctx.moveTo(divX, PILL_TOP + 10);
    ctx.lineTo(divX, PILL_TOP + PILL_H - 10);
    ctx.stroke();
    ctx.restore();

    ctx.font         = '700 36px Poppins, sans-serif';
    ctx.fillStyle    = pal.G;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(streakLabel, divX + DIV_W + GAP, PILL_TOP + PILL_H / 2 + 2);

    // ── Mandala SVG ──────────────────────────────────────────────────────────
    // Grab the live SVG rendered in the ShareModal, serialize to data URL,
    // and draw it on canvas — more reliable than html2canvas in WKWebView.
    const svgEl = document.querySelector('#streak-share-card svg') as SVGElement | null;
    // Match DOM card: mandala container is full card width × 210/356 of card height
    const MANDALA_SIZE = CW;
    const MANDALA_X    = CX;
    const MANDALA_Y    = CY + 144; // 48 CSS × 3

    ctx.save();
    roundedRect(ctx, CX, CY, CW, CH, CR);
    ctx.clip();

    if (svgEl) {
        try {
            const clone = svgEl.cloneNode(true) as SVGElement;
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('width', String(MANDALA_SIZE));
            clone.setAttribute('height', String(MANDALA_SIZE));
            const svgStr = new XMLSerializer().serializeToString(clone);
            const b64    = btoa(unescape(encodeURIComponent(svgStr)));
            const mandalaImg = await loadImg(`data:image/svg+xml;base64,${b64}`);
            ctx.drawImage(mandalaImg, MANDALA_X, MANDALA_Y, MANDALA_SIZE, MANDALA_SIZE);
        } catch {
            // Soft fallback: faint circle so the card still looks intentional
            ctx.globalAlpha = 0.12;
            ctx.fillStyle   = pal.T;
            ctx.beginPath();
            ctx.arc(CX + CW / 2, MANDALA_Y + MANDALA_SIZE / 2, MANDALA_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    ctx.restore();

    // ── Info panel ───────────────────────────────────────────────────────────
    const INFO_MX = 42, INFO_B = 30;
    const INFO_W  = CW - INFO_MX * 2;
    const INFO_H  = firstName ? 178 : 148;
    const INFO_X  = CX + INFO_MX;
    const INFO_Y  = CY + CH - INFO_B - INFO_H;

    ctx.fillStyle = pal.bg1;
    roundedRect(ctx, INFO_X, INFO_Y, INFO_W, INFO_H, 30);
    ctx.fill();

    // Progress line
    ctx.font         = '500 18px Inter, sans-serif';
    ctx.fillStyle    = pal.G;
    ctx.globalAlpha  = 0.88;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(progressLine, INFO_X + INFO_W / 2, INFO_Y + 24);
    ctx.globalAlpha = 1;

    let curY = INFO_Y + 24 + 26;

    if (firstName) {
        ctx.font        = '400 16px Inter, sans-serif';
        ctx.fillStyle   = pal.G;
        ctx.globalAlpha = 0.5;
        ctx.fillText(`${firstName}'s garden`, INFO_X + INFO_W / 2, curY);
        ctx.globalAlpha = 1;
        curY += 26;
    }

    curY += 10;
    ctx.save();
    ctx.globalAlpha  = 0.2;
    ctx.strokeStyle  = pal.G;
    ctx.lineWidth    = 1.5;
    ctx.beginPath();
    ctx.moveTo(INFO_X + INFO_W * 0.1, curY);
    ctx.lineTo(INFO_X + INFO_W * 0.9, curY);
    ctx.stroke();
    ctx.restore();
    curY += 14;

    ctx.font         = '700 21px Poppins, sans-serif';
    ctx.fillStyle    = pal.T;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PALANTE.APP', INFO_X + INFO_W / 2, curY);
    curY += 30;

    ctx.font        = '500 14px Inter, sans-serif';
    ctx.fillStyle   = '#FFFFFF';
    ctx.globalAlpha = 0.65;
    ctx.fillText('FORWARD, TOGETHER — EVERY SINGLE DAY', INFO_X + INFO_W / 2, curY);
    ctx.globalAlpha = 1;

    const base64   = canvas.toDataURL('image/jpeg', 0.93).split(',')[1];
    const fileName = `palante_streak_${Date.now()}.jpg`;
    return { base64, fileName };
}

export async function shareStreakCard(params: {
    streak: number;
    colorCycle?: number;
    totalPractices?: number;
    firstName?: string;
}): Promise<void> {
    haptics.light();
    try {
        const { base64, fileName } = await generateStreakStoryImage({
            streak:         params.streak,
            totalPractices: params.totalPractices ?? 0,
            colorCycle:     params.colorCycle     ?? 0,
            firstName:      params.firstName,
        });

        const saved = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
        });

        const { streak } = params;
        await Share.share({
            title:       'My Palante Streak',
            text:        `${streak} day${streak !== 1 ? 's' : ''} and counting. Growing with Palante.\npalante.app`,
            files:       [saved.uri],
            dialogTitle: 'Share your streak',
        });

        haptics.success();
    } catch (err) {
        console.error('Streak share failed:', err);
        haptics.error();
        try {
            await Share.share({
                title: 'My Palante Streak',
                text:  `${params.streak} day${params.streak !== 1 ? 's' : ''} and counting. Growing with Palante.`,
            });
        } catch { /* silence */ }
    }
}

export async function downloadStreakCard(params: {
    colorCycle?: number;
    totalPractices?: number;
    firstName?: string;
} | number = 0): Promise<void> {
    // Accept legacy `colorCycle` number call or new params object
    const p = typeof params === 'number'
        ? { colorCycle: params, totalPractices: 0, firstName: undefined }
        : params;

    haptics.light();
    try {
        const { base64, fileName } = await generateStreakStoryImage({
            streak:         0,
            totalPractices: p.totalPractices ?? 0,
            colorCycle:     p.colorCycle     ?? 0,
            firstName:      p.firstName,
        });

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
