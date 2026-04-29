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
        quote.author === 'Palante Coach' ||
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
    ctx.fillText('PERSONALIZED MOTIVATION, DELIVERED DAILY', W / 2, brandingY);

    ctx.font      = '800 34px Inter, sans-serif';
    ctx.fillStyle = 'rgba(253,251,247,0.88)';
    ctx.fillText('@PALANTE.APP', W / 2, brandingY + 46);

    // JPEG 92% — smaller than PNG, perfect for social upload
    return canvas.toDataURL('image/jpeg', 0.92);
}
