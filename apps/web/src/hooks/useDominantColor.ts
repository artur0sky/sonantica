import { useState, useEffect } from 'react';

export function useDominantColor(url?: string) {
  const [color, setColor] = useState<string>('#1a1a1a'); // Default surface color
  const [contrastColor, setContrastColor] = useState<string>('#ffffff');

  useEffect(() => {
    if (!url) {
      setColor('#1a1a1a');
      setContrastColor('#ffffff');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        // Draw to 1x1 to get average
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const [r, g, b] = data;
        
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        setColor(hex);

        // Simple YIQ formula to determine brightness
        // Higher than 128 is bright, use black text. Lower is dark, use white text.
        const brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
        setContrastColor(brightness > 140 ? '#000000' : '#ffffff');
      } catch (e) {
        console.warn('Failed to extract dominant color:', e);
        // Fallback to default if extraction fails (e.g. tainted canvas)
        setColor('#1a1a1a'); 
        setContrastColor('#ffffff');
      }
    };
    img.onerror = (e) => {
      console.warn('Failed to load image for color extraction:', e);
      setColor('#1a1a1a');
      setContrastColor('#ffffff');
    };
  }, [url]);

  return { color, contrastColor };
}
