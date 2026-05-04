import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return ('standalone' in navigator) && (navigator as Navigator & { standalone: boolean }).standalone;
}

export function IOSInstallBanner() {
  const { isDark } = useDarkMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIOS() && !isInStandaloneMode() && !sessionStorage.getItem('ataraxia_ios_banner_dismissed')) {
      // Small delay so it doesn't flash on load
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('ataraxia_ios_banner_dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 border-t ${
      isDark
        ? 'bg-[#243347] border-[#3A4A5E] text-[#E8E6E0]'
        : 'bg-white border-[#D4D2CA] text-[#2D2D2D]'
    }`} style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'
        }`}>
          <span className="text-white font-bold text-lg">a</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Add ataraxia to your home screen</p>
          <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            Tap <Share className="inline w-3.5 h-3.5 mx-0.5 align-text-bottom" /> then "Add to Home Screen" for the full app experience.
          </p>
        </div>
        <button onClick={dismiss} className={`p-1 rounded-lg flex-shrink-0 ${isDark ? 'hover:bg-[#2D3E54]' : 'hover:bg-[#F8F7F4]'}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
