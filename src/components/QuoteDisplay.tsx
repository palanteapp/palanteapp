import React from 'react';
import type { Quote } from '../types';
import { Share2, Sparkles, User, Volume2, Square, RefreshCw, Heart, X, Facebook, Twitter, Linkedin, Instagram, MessageCircle, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QuoteCardGenerator } from './QuoteCardGenerator';

interface QuoteDisplayProps {
  quote: Quote;
  onNewQuote: (sourceOverride?: 'human' | 'ai') => void;
  isDarkMode: boolean;
  voicePreference?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ quote, onNewQuote, isDarkMode, voicePreference = 'nova', isFavorited = false, onToggleFavorite }) => {
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);

  React.useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [quote]);


  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(`${quote.text} ... by ${quote.author}`);
      utterance.rate = 0.9; // Slightly slower for more natural feel
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      // Map new voice preferences to gender preferences
      const femaleVoices = ['nova', 'shimmer', 'alloy'];
      const isFemale = femaleVoices.includes(voicePreference || 'nova');

      if (isFemale) {
        // Priority list for female voices
        const femaleVoiceNames = ['Samantha', 'Google US English', 'Microsoft Zira', 'Victoria', 'Karen'];
        for (const name of femaleVoiceNames) {
          selectedVoice = voices.find(v => v.name.includes(name));
          if (selectedVoice) break;
        }
      } else {
        // Priority list for male voices
        const maleVoiceNames = ['Alex', 'Google UK English Male', 'Microsoft David', 'Daniel', 'Fred'];
        for (const name of maleVoiceNames) {
          selectedVoice = voices.find(v => v.name.includes(name));
          if (selectedVoice) break;
        }
      }

      // Fallback if no specific gender match found
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // Adjust pitch slightly based on voice to sound more natural
        if (selectedVoice.name.includes('Google')) {
          utterance.pitch = isFemale ? 1.0 : 0.9;
        }
      }

      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleShare = async () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    // Slight delay to ensure render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const element = document.getElementById('quote-card-generator');
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 1, // Already at high res
          backgroundColor: null,
          useCORS: true, // For images if any
        });

        const image = canvas.toDataURL('image/png');

        // Check for native share support of files
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

  const shareToEmail = () => {
    const subject = 'Inspiring Quote from Palante';
    const body = `"${quote.text}"\n\n- ${quote.author}\n\nShared from Palante`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
    setShowShareMenu(false);
  };

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'tiktok') => {
    const text = `"${quote.text}" - ${quote.author}`;
    const url = window.location.href;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        // Instagram doesn't support web sharing, copy to clipboard instead
        navigator.clipboard.writeText(text);
        alert('Quote copied to clipboard! Open Instagram and paste to share.');
        setShowShareMenu(false);
        return;
      case 'tiktok':
        // TikTok doesn't support web sharing, copy to clipboard instead
        navigator.clipboard.writeText(text);
        alert('Quote copied to clipboard! Open TikTok and paste to share.');
        setShowShareMenu(false);
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };


  return (
    <>
      <QuoteCardGenerator id="quote-card-generator" quote={quote} isDarkMode={isDarkMode} />

      <div
        className={`relative group ${isDarkMode ? 'bg-warm-gray-green' : 'bg-white'} p-6 rounded-2xl shadow-spa transition-all duration-300`}
        style={{ minHeight: '220px' }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-sage-beige opacity-10 blur-2xl rounded-2xl pointer-events-none" />



        {/* Quote Content */}
        <div className="relative z-10 flex flex-col h-full justify-between items-center text-center px-8">

          {/* Header: Category & Source */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold tracking-widest uppercase ${isDarkMode ? 'text-pale-gold' : 'text-sage'}`}>
              {quote.category}
            </span>
            <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />
            <button
              onClick={() => onNewQuote(quote.isAI ? 'human' : 'ai')}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-warm-gray-green/40 hover:text-warm-gray-green'}`}
            >
              {quote.isAI ? <Sparkles size={12} /> : <User size={12} />}
              {quote.isAI ? 'Palante Coach' : 'Human'}
            </button>
          </div>

          {/* Quote Text */}
          <blockquote className="mb-4 flex-1 flex flex-col justify-center">
            <p className={`text-xl md:text-2xl font-display font-medium leading-relaxed ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
              "{quote.text}"
            </p>
            <footer className={`mt-3 text-sm font-body ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
              — {quote.author}
            </footer>
          </blockquote>

          {/* Source Toggle - Under Quote */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => onNewQuote('human')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${!quote.isAI
                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-spa' : 'bg-sage text-white shadow-spa'
                : isDarkMode ? 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-white/40 border border-sage/20 text-warm-gray-green/60 hover:bg-white/60 hover:text-warm-gray-green'
                }`}
            >
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>Human</span>
              </div>
            </button>

            <div className={`w-px h-4 ${isDarkMode ? 'bg-white/20' : 'bg-sage/20'}`} />

            <button
              onClick={() => onNewQuote('ai')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${quote.isAI
                ? isDarkMode ? 'bg-pale-gold text-warm-gray-green shadow-spa' : 'bg-sage text-white shadow-spa'
                : isDarkMode ? 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-white/40 border border-sage/20 text-warm-gray-green/60 hover:bg-white/60 hover:text-warm-gray-green'
                }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>Palante Coach</span>
              </div>
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            {/* Favorite */}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-full transition-all ${isFavorited
                  ? 'text-rose-500 bg-rose-500/10'
                  : isDarkMode ? 'text-white/40 hover:text-rose-300 hover:bg-white/5' : 'text-sage/40 hover:text-rose-400 hover:bg-sage/5'}`}
                aria-label={isFavorited ? "Unsave" : "Save"}
              >
                <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            )}

            {/* Listen */}
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-full transition-all ${isSpeaking
                ? isDarkMode ? 'text-pale-gold bg-pale-gold/10' : 'text-sage bg-sage/10'
                : isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-sage/40 hover:text-sage hover:bg-sage/5'}`}
              aria-label="Listen"
            >
              {isSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-sage/40 hover:text-sage hover:bg-sage/5'}`}
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>

            {/* Refresh (Explicit) */}
            <button
              onClick={() => onNewQuote()}
              className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-sage/40 hover:text-sage hover:bg-sage/5'}`}
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

                {/* Quote Preview Card */}
                <div className={`mb-6 p-8 rounded-xl border-2 ${isDarkMode ? 'bg-white/5 border-sage/20' : 'bg-gradient-to-br from-sage/5 to-pale-gold/5 border-sage/20'}`}>
                  {/* Logo and Branding */}
                  <div className="flex flex-col items-center mb-6">
                    <img
                      src={isDarkMode ? '/logo-dark.png' : '/logo-light.png'}
                      alt="Palante"
                      className="w-12 h-12 object-contain mb-3"
                    />
                    <h4 className={`text-2xl font-display font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                      Palante
                    </h4>
                    <p className={`text-xs font-body tracking-widest uppercase mt-1 ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>
                      Personalized Progress, Delivered Daily
                    </p>
                  </div>

                  {/* Quote */}
                  <blockquote className="mb-6">
                    <p className={`text-lg font-display font-medium leading-relaxed mb-3 text-center ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                      "{quote.text}"
                    </p>
                    <footer className={`text-sm font-body text-center ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                      — {quote.author}
                    </footer>
                  </blockquote>

                  {/* Sharing Message */}
                  <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`}>
                    <p className={`text-xs font-body text-center ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>
                      Sharing is caring, don't forget to tag us
                    </p>
                  </div>
                </div>

                {/* Share Options */}
                <div className="space-y-3">
                  {/* NEW: Instagram Story / Image Generator */}
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isDarkMode
                      ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-white/10 hover:border-pink-500/50'
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-pink-300 hover:shadow-spa'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}>
                      {isGeneratingImage ? (
                        <div className="animate-spin h-5 w-5 border-2 border-pink-500 rounded-full border-t-transparent" />
                      ) : (
                        <Sparkles size={20} className="text-pink-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Share to Instagram Story
                      </span>
                      <span className={`block text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                        Create beautiful 9:16 quote art
                      </span>
                    </div>
                  </button>

                  {/* SMS - Now uses Image */}
                  <button
                    onClick={handleGenerateImage} // Reuse image generation for "Text Message" to share the card
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isDarkMode
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-sage/20' : 'bg-sage/10'}`}>
                      <MessageCircle size={20} className={isDarkMode ? 'text-sage' : 'text-sage'} />
                    </div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                      Text Message
                    </span>
                  </button>

                  {/* Email */}
                  <button
                    onClick={shareToEmail}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isDarkMode
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pale-gold/20' : 'bg-pale-gold/10'}`}>
                      <Mail size={20} className={isDarkMode ? 'text-pale-gold' : 'text-pale-gold'} />
                    </div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>
                      Email
                    </span>
                  </button>

                  {/* Social Media Grid */}
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {/* Instagram */}
                    <button
                      onClick={() => shareToSocial('instagram')}
                      className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                        }`}
                      title="Instagram"
                    >
                      <Instagram size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                    </button>
                    {/* TikTok */}
                    <button
                      onClick={() => shareToSocial('tiktok')}
                      className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                        }`}
                      title="TikTok"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}>
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="currentColor" />
                      </svg>
                    </button>
                    {/* Twitter */}
                    <button
                      onClick={() => shareToSocial('twitter')}
                      className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                        }`}
                      title="Twitter / X"
                    >
                      <Twitter size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                    </button>
                    {/* Facebook */}
                    <button
                      onClick={() => shareToSocial('facebook')}
                      className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                        }`}
                      title="Facebook"
                    >
                      <Facebook size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                    </button>
                    {/* LinkedIn */}
                    <button
                      onClick={() => shareToSocial('linkedin')}
                      className={`aspect-square rounded-xl border transition-all flex items-center justify-center ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white/60 border-sage/20 hover:bg-white hover:shadow-spa'
                        }`}
                      title="LinkedIn"
                    >
                      <Linkedin size={24} className={isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'} />
                    </button>
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


