import React, { useState, useEffect } from 'react';
import { Share2, Heart, Volume2, Square, RefreshCw, Sparkles, User, X } from 'lucide-react';
import type { Quote } from '../types';
import { QuoteCardGenerator } from './QuoteCardGenerator';
import html2canvas from 'html2canvas';
import { speak, stop as stopTTS, type OpenAIVoice } from '../utils/ttsService';

interface QuoteDisplayProps {
  quote: Quote;
  onNewQuote: (sourceOverride?: 'human' | 'ai') => void;
  isDarkMode: boolean;
  voicePreference: OpenAIVoice;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  onNewQuote,
  isDarkMode,
  voicePreference = 'nova',
  isFavorited = false,
  onToggleFavorite
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cancel speech when quote changes
  useEffect(() => {
    stopTTS();
    setIsSpeaking(false);
  }, [quote]);

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopTTS();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await speak(
        `${quote.text} ... by ${quote.author}`,
        voicePreference,
        () => { }, // onStart
        () => setIsSpeaking(false) // onEnd
      );
    }
  };

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

        if (navigator.share) {
          try {
            const blob = await (await fetch(image)).blob();
            const file = new File([blob], 'palante_quote.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Inspiration from Palante',
                text: `"${quote.text}" - ${quote.author}`,
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
  const iconColor = isDarkMode ? 'text-pale-gold' : 'text-sage';
  const buttonClass = isDarkMode
    ? 'text-white/40 hover:text-white hover:bg-white/5'
    : 'text-sage/40 hover:text-sage hover:bg-sage/5';

  return (
    <>
      <QuoteCardGenerator id="quote-card-generator" quote={quote} isDarkMode={isDarkMode} />

      <div className="relative w-full max-w-4xl mx-auto min-h-[500px] flex items-center justify-center p-4">
        {/* Main Quote Card */}
        <div className="relative w-full max-w-2xl z-10 flex flex-col items-center text-center">

          {/* Source Toggle (Human / AI) */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => onNewQuote('human')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${!quote.isAI
                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-spa' : 'bg-sage text-white shadow-spa'
                : isDarkMode ? 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20' : 'bg-white/40 border border-sage/20 text-warm-gray-green/60 hover:bg-white/60'
                }`}
            >
              <User size={14} />
              <span>Human</span>
            </button>

            <div className={`w-px h-4 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />

            <button
              onClick={() => onNewQuote('ai')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${quote.isAI
                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-spa' : 'bg-sage text-white shadow-spa'
                : isDarkMode ? 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20' : 'bg-white/40 border border-sage/20 text-warm-gray-green/60 hover:bg-white/60'
                }`}
            >
              <Sparkles size={14} />
              <span>Palante Coach</span>
            </button>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`px-4 py-1 rounded-full border ${isDarkMode ? 'border-white/20 text-white/60' : 'border-sage/20 text-sage'} text-xs font-medium uppercase tracking-widest`}>
              {quote.category}
            </div>
            {quote.isAI && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isDarkMode ? 'bg-pale-gold/20 text-pale-gold' : 'bg-sage/10 text-sage'}`}>
                <Sparkles size={12} />
                <span>Generated for you</span>
              </div>
            )}
          </div>

          {/* Quote Text */}
          <div className="mb-10 relative px-4">
            <span className={`absolute -top-8 -left-2 md:-left-6 text-6xl font-serif opacity-20 ${iconColor}`}>
              "
            </span>
            <h1 className={`text-3xl md:text-5xl font-display font-medium leading-tight ${textColor} transition-all duration-500`}>
              {quote.text}
            </h1>
            <span className={`absolute -bottom-4 -right-2 md:-right-6 text-6xl font-serif opacity-20 ${iconColor}`}>
              "
            </span>
          </div>

          {/* Author & Divider */}
          <div className="flex flex-col items-center gap-4 mb-12">
            <div className={`w-12 h-0.5 rounded-full opacity-40 ${isDarkMode ? 'bg-white' : 'bg-sage'}`}></div>
            <p className={`text-lg font-body ${subTextColor}`}>
              {quote.author}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
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

            {/* Audio Playback */}
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-full transition-all ${isSpeaking
                ? isDarkMode ? 'text-pale-gold bg-pale-gold/10' : 'text-sage bg-sage/10'
                : buttonClass
                }`}
              aria-label="Listen"
            >
              {isSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
            </button>

            {/* Share */}
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`p-2 rounded-full transition-all ${buttonClass}`}
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>

            {/* Refresh / New Quote */}
            <button
              onClick={() => onNewQuote()}
              className={`p-2 rounded-full transition-all ${buttonClass}`}
              aria-label="New Quote"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Share Modal */}
          {showShareMenu && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setShowShareMenu(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* Modal */}
              <div
                className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-warm-gray-green' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowShareMenu(false)}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-sage/10'}`}
                >
                  <X size={20} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                </button>

                {/* Header */}
                <h3 className={`text-xl font-display font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                  Share Quote
                </h3>

                {/* Quote Preview Card - Matches QuoteCardGenerator aesthetic */}
                <div
                  className={`relative mb-6 rounded-3xl overflow-hidden mx-auto ${isDarkMode ? 'bg-warm-gray-green' : 'bg-gradient-to-br from-ivory via-sand-beige to-sage/20'}`}
                  style={{ aspectRatio: '9/16', maxHeight: '400px', width: '225px' }}
                >
                  {/* Background Circles (Geometric) */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 rounded-full translate-x-1/3 -translate-y-1/3 opacity-20 ${isDarkMode ? 'bg-white' : 'bg-sage'}`}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-24 h-24 rounded-full -translate-x-1/3 translate-y-1/3 bg-pale-gold opacity-20"
                  />

                  {/* Border Frame */}
                  <div className={`absolute inset-3 border rounded-2xl pointer-events-none ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`} />

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 gap-6">
                    {/* Logo and Branding */}
                    <div className="flex flex-col items-center gap-1 pt-2">
                      <img
                        src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                        alt="Palante"
                        className="w-8 h-8 object-contain"
                      />
                      <span className={`text-sm font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                        Palante
                      </span>
                      <span className={`text-[8px] font-body tracking-widest uppercase ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                        Personalized Motivation, Delivered Daily
                      </span>
                    </div>

                    {/* Quote Section */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                      {/* Decorative Quote Mark */}
                      <span className={`text-3xl font-display opacity-20 mb-2 ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
                        "
                      </span>

                      {/* Quote Text */}
                      <p className={`text-sm font-display font-medium leading-snug mb-3 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                        {quote.text.length > 80 ? quote.text.substring(0, 80) + '...' : quote.text}
                      </p>

                      {/* Divider */}
                      <div className={`w-8 h-0.5 rounded-full mb-2 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />

                      {/* Author */}
                      <p className={`text-xs font-body ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                        {quote.author}
                      </p>

                      {/* Category Pill */}
                      <div className={`mt-3 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${isDarkMode ? 'border-white/20 text-white/60' : 'border-sage/20 text-sage/80'}`}>
                        {quote.category}
                      </div>
                    </div>

                    {/* Footer */}
                    <p className={`text-[8px] font-body opacity-60 ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                      Sharing is caring, don't forget to tag us
                    </p>
                  </div>
                </div>

                {/* Share Options */}
                <div className="space-y-4">
                  {/* Single Download Button */}
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${isDarkMode
                      ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-white/20 hover:border-pink-500/50 hover:shadow-lg'
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 hover:border-pink-400 hover:shadow-spa'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}>
                      {isGeneratingImage ? (
                        <div className="animate-spin h-6 w-6 border-3 border-pink-500 rounded-full border-t-transparent" />
                      ) : (
                        <Sparkles size={24} className="text-pink-500" />
                      )}
                    </div>
                    <div className="text-center">
                      <span className={`block text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {isGeneratingImage ? 'Generating...' : 'Download Quote Image'}
                      </span>
                      <span className={`block text-xs mt-1 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                        Save and share on any platform
                      </span>
                    </div>
                  </button>

                  {/* Info Message */}
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-sage/5 border-sage/20'}`}>
                    <p className={`text-xs text-center ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                      💡 Download the image and share it on Instagram, Facebook, Twitter, or any platform you like
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
