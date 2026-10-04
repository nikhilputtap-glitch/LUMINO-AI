export function generateSvgArtwork(
  prompt: string, 
  quality: '4K' | '8K' | '16K' = '4K', 
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' = '1:1',
  style: string = 'photorealistic'
): string {
  // Dimensions
  let width = 3840;
  let height = 2160;
  if (aspectRatio === '1:1') {
    width = 3840;
    height = 3840;
  } else if (aspectRatio === '9:16') {
    width = 2160;
    height = 3840;
  } else if (aspectRatio === '4:3') {
    width = 3840;
    height = 2880;
  }

  if (quality === '8K') {
    width *= 2;
    height *= 2;
  } else if (quality === '16K') {
    width *= 4;
    height *= 4;
  }

  // Derive dynamic color schemes from prompt hash
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60 + (Math.abs(hash >> 3) % 120)) % 360;
  const hue3 = (hue1 + 180 + (Math.abs(hash >> 5) % 90)) % 360;

  const color1 = `hsl(${hue1}, 80%, 25%)`;
  const color2 = `hsl(${hue2}, 85%, 45%)`;
  const color3 = `hsl(${hue3}, 90%, 65%)`;

  const safePrompt = prompt.replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a14"/>
      <stop offset="40%" stop-color="${color1}"/>
      <stop offset="85%" stop-color="${color2}"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${color3}" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="${color2}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${color1}" stop-opacity="0"/>
    </radialGradient>
    <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="60" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  
  <!-- Ambient Atmospheric Light -->
  <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${width * 0.35}" fill="url(#sunGlow)" filter="url(#bloom)" opacity="0.85"/>
  <circle cx="${width * 0.2}" cy="${height * 0.7}" r="${width * 0.25}" fill="${color2}" opacity="0.3" filter="url(#bloom)"/>
  <circle cx="${width * 0.8}" cy="${height * 0.3}" r="${width * 0.3}" fill="${color3}" opacity="0.25" filter="url(#bloom)"/>

  <!-- Geometric Abstract Cinema Framing -->
  <g opacity="0.4" stroke="${color3}" stroke-width="3" fill="none">
    <polygon points="${width * 0.5},${height * 0.15} ${width * 0.85},${height * 0.75} ${width * 0.15},${height * 0.75}" />
    <circle cx="${width * 0.5}" cy="${height * 0.48}" r="${height * 0.28}" />
    <rect x="${width * 0.25}" y="${height * 0.25}" width="${width * 0.5}" height="${height * 0.5}" rx="40" />
  </g>

  <!-- Grid Waves -->
  <path d="M0 ${height * 0.75} Q ${width * 0.25} ${height * 0.65}, ${width * 0.5} ${height * 0.75} T ${width} ${height * 0.75} L ${width} ${height} L 0 ${height} Z" fill="hsl(${hue1}, 90%, 10%)" opacity="0.8"/>
  <path d="M0 ${height * 0.82} Q ${width * 0.35} ${height * 0.75}, ${width * 0.65} ${height * 0.85} T ${width} ${height * 0.8} L ${width} ${height} L 0 ${height} Z" fill="#030306" opacity="0.9"/>

  <!-- Watermark / Metadata Overlay -->
  <rect x="${width * 0.04}" y="${height * 0.04}" width="${width * 0.3}" height="${height * 0.1}" rx="20" fill="rgba(0,0,0,0.5)" backdrop-filter="blur(20px)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <text x="${width * 0.06}" y="${height * 0.08}" font-family="system-ui, -apple-system, sans-serif" font-size="${height * 0.024}" font-weight="800" fill="#ffffff" letter-spacing="2">LUMINO-6.7OMG STUDIO</text>
  <text x="${width * 0.06}" y="${height * 0.11}" font-family="system-ui, -apple-system, sans-serif" font-size="${height * 0.016}" font-weight="600" fill="${color3}">${quality} ULTRA HD • ${style.toUpperCase()}</text>

  <!-- Prompt Label in Lower Third -->
  <rect x="${width * 0.05}" y="${height * 0.88}" width="${width * 0.9}" height="${height * 0.08}" rx="24" fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <text x="${width * 0.07}" y="${height * 0.93}" font-family="system-ui, -apple-system, sans-serif" font-size="${height * 0.022}" font-weight="500" fill="#f3f4f6">"${safePrompt.length > 90 ? safePrompt.slice(0, 90) + '...' : safePrompt}"</text>
</svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
