import { useState } from 'react';
import { Share2, Heart, Lightbulb, Clock } from 'lucide-react';
import type { Quote } from '../types';
import { QuoteCardGenerator } from './QuoteCardGenerator';
import { ShareModal } from './ShareModal';
import html2canvas from 'html2canvas';

interface QuoteDisplayProps {
  quote: Quote;
  isDarkMode: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onOpenHistory?: () => void;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  isDarkMode,
  isFavorited,
  onToggleFavorite,
  onOpenHistory
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const element = document.getElementById('quote-card-generator');
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 1,
          backgroundColor: null,
          useCORS: true,
        });

        const image = canvas.toDataURL('image/png');

        try {
          // Try Capacitor Share first
          const { Share } = await import('@capacitor/share');
          const { Directory, Filesystem } = await import('@capacitor/filesystem');

          // Write file to cache
          const fileName = `palante_quote_${Date.now()}.png`;
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: image.split(',')[1],
            directory: Directory.Cache
          });

          await Share.share({
            title: 'Inspiration from Palante',
            text: quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire'
              ? `"${quote.text}"\n\n- @palante.app` // Tier quote
              : `"${quote.text}" - ${quote.author}\n\n- @palante.app`, // Standard quote
            url: savedFile.uri,
          });

          setShowShareMenu(false);
          setIsGeneratingImage(false);
          return;

        } catch (capacitorError) {
          console.log('Capacitor share failed, trying native...', capacitorError);
        }

        if (navigator.share) {
          try {
            const blob = await (await fetch(image)).blob();
            const file = new File([blob], 'palante_quote.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              const isTierQuote = quote.author === 'Muse' || quote.author === 'Focus' || quote.author === 'Fire';
              const shareText = isTierQuote
                ? `"${quote.text}"\n\n- @palante.app`
                : `"${quote.text}" - ${quote.author}\n\n- @palante.app`;

              await navigator.share({
                files: [file],
                title: 'Inspiration from Palante',
                text: shareText,
              });
              setShowShareMenu(false);
              setIsGeneratingImage(false);
              return;
            }
          } catch (shareError) {
            console.log('Native share failed, falling back to download', shareError);
          }
        }

        // Fallback: Download
        const link = document.createElement('a');
        link.href = image;
        link.download = `palante_quote_${Date.now()}.png`;
        link.click();

        alert('Image saved to your device! You can now upload it to your Story.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Could not generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
      setShowShareMenu(false);
    }
  };


  const textColor = isDarkMode ? 'text-white' : 'text-warm-gray-green';
  const subTextColor = isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60';
  const buttonClass = isDarkMode
    ? 'text-white/40 hover:text-white hover:bg-white/5'
    : 'text-sage/40 hover:text-sage hover:bg-sage/5';

  return (
    <>
      <QuoteCardGenerator id="quote-card-generator" quote={quote} isDarkMode={isDarkMode} />

      <div className={`relative w-full flex items-center justify-center transition-opacity duration-300 ${showShareMenu ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Main Quote Card - Polished Layout */}
        <div className={`relative w-full z-10 flex flex-col items-center justify-center text-center p-8 md:p-14 rounded-[2.5rem] border backdrop-blur-md transition-all duration-300 ${isDarkMode
          ? 'bg-black/20 border-white/10 shadow-2xl'
          : 'bg-white/70 border-sage/20 shadow-spa-xl'
          }`}
        >
          {/* Subtle Circular Gradient Background */}
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
            <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-[0.15] ${isDarkMode ? 'bg-pale-gold' : 'bg-sage'}`}></div>
            <div className={`absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-[0.1] ${isDarkMode ? 'bg-white' : 'bg-warm-gray-green'}`}></div>
          </div>

          {/* Watermark Icon - Centered in Card */}
          <div className={`absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none ${isDarkMode ? 'text-white' : 'text-sage'}`}>
            <Lightbulb size={180} strokeWidth={1} />
          </div>

          {/* Quote Text Area */}
          <div className="mb-6 relative w-full flex flex-col items-center justify-center">



            {/* Main Text */}
            <h1 className={`relative z-10 text-3xl md:text-4xl font-display font-medium leading-tight ${textColor} transition-all duration-500 text-center w-full px-4`}>
              {quote.text}
            </h1>
          </div>

          {/* Author & Divider */}
          <div className="flex flex-col items-center justify-center gap-4 mb-6 relative z-10 w-full">
            <div className={`w-12 h-0.5 rounded-full opacity-40 ${isDarkMode ? 'bg-white' : 'bg-sage'}`}></div>
            <p className={`text-lg font-body text-center ${subTextColor}`}>
              {quote.author}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-center gap-2 relative z-10">
            {/* Favorite */}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-full transition-all ${isFavorited
                  ? 'text-rose-500 bg-rose-500/10'
                  : buttonClass
                  }`}
                aria-label={isFavorited ? "Unsave" : "Save"}
              >
                <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            )}

            {/* History */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className={`p-2 rounded-full transition-all ${buttonClass}`}
                aria-label="View History"
              >
                <Clock size={18} />
              </button>
            )}



            {/* Share */}
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`p-2 rounded-full transition-all ${buttonClass}`}
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>

        </div>
      </div>

      <ShareModal
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        quote={quote}
        isDarkMode={isDarkMode}
        onGenerateImage={handleGenerateImage}
        isGeneratingImage={isGeneratingImage}
      />
    </>
  );
};
