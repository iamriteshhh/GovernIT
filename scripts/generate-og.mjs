import sharp from "sharp";
import path from "path";

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Subtle grid lines -->
  <line x1="80" y1="0" x2="80" y2="630" stroke="#334155" stroke-opacity="0.3" stroke-width="1" />
  <line x1="1120" y1="0" x2="1120" y2="630" stroke="#334155" stroke-opacity="0.3" stroke-width="1" />
  <line x1="0" y1="80" x2="1200" y2="80" stroke="#334155" stroke-opacity="0.3" stroke-width="1" />
  <line x1="0" y1="550" x2="1200" y2="550" stroke="#334155" stroke-opacity="0.3" stroke-width="1" />

  <!-- Top Badge -->
  <g transform="translate(100, 100)">
    <rect width="360" height="42" rx="21" fill="#064e3b" stroke="#059669" stroke-width="1.5" />
    <circle cx="24" cy="21" r="6" fill="#10b981" />
    <text x="42" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#a7f3d0" letter-spacing="1">100% OFFICIALLY VERIFIED</text>
  </g>

  <!-- Main Title -->
  <text x="100" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="#f8fafc" letter-spacing="-1">
    GovernIT
  </text>
  <text x="100" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="700" fill="#94a3b8">
    One-Stop Government Opportunity Finder
  </text>

  <!-- Description -->
  <text x="100" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#cbd5e1">
    UPSC, SSC, Banking &amp; State Recruitments alongside Citizen Welfare Schemes.
  </text>
  <text x="100" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#94a3b8">
    Real-time Indian Standard Time deadlines • Gazette citations • Direct portal links
  </text>

  <!-- Bottom Badges / Stats -->
  <g transform="translate(100, 480)">
    <rect width="280" height="50" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="24" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">🏛️ 20+ Verified Exams</text>
  </g>

  <g transform="translate(400, 480)">
    <rect width="280" height="50" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="24" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">📋 22+ Citizen Schemes</text>
  </g>

  <g transform="translate(700, 480)">
    <rect width="320" height="50" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="24" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#10b981">✓ Zero Fabrication Guarantee</text>
  </g>
</svg>
`;

async function generate() {
  const outputPath = path.resolve("public/og-image.png");
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log("Generated og-image.png successfully at:", outputPath);
}

generate().catch(console.error);
