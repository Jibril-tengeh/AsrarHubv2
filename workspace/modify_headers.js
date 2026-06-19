const fs = require('fs');
const path = require('path');

const files = [
  'PlanetaryHours.tsx',
  'ZairajaAnalyzer.tsx',
  'TasbihCounter.tsx',
  'WafqGenerator.tsx',
  'AsmaulHusna.tsx',
  'RouhaniyyahExtractor.tsx',
  'TaksirGenerator.tsx',
  'ZakatCalculator.tsx',
  'PrayerTimes.tsx',
  'QiblaCompass.tsx',
  'HijriCalendar.tsx',
  'FaraidCalculator.tsx',
  'HabitTracker.tsx',
];

const SHARE_IMPORT = "import ShareToCommunity from './ShareToCommunity';";

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'components', 'user', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add import if not exists
    if (!content.includes('ShareToCommunity')) {
      content = content.replace(/import React[^;]*;/, (match) => match + '\n' + SHARE_IMPORT);
    }
    
    // Replace header 
    // We want to wrap the <h1 ... > ... </h1> and ArrowLeft button in a flex items-center justify-between
    // Actually simpler: find `<button onClick={() => navigate(-1)}` or similar, check previous line for `flex`, 
    // but the safest regex or logic is:
    
    // There are some standard headers like:
    /*
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} ...>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold tracking-tight">Title</h1>
      </div>
    */

    const nameMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const title = nameMatch ? nameMatch[1] : file.replace('.tsx', '');
    
    const replaceHeaderRegex1 = /(<div className="flex items-center[^>]*>)\s*(<button[^>]*navigate\(-1\)[^>]*>[\s\S]*?<\/button>[\s\S]*?<h1[^>]*>[^<]*<\/h1>\s*)<\/div>/;
    
    const replaceHeaderRegex2 = /(<div className="[^"]*flex[^"]*items-center[^"]*justify-center text-center[^>]*>)\s*(<Link to='\/tools'[^>]*>[\s\S]*?<\/Link>[\s\S]*?<h1[^>]*>[^<]*<\/h1>\s*)<\/div>/;
    
    content = content.replace(replaceHeaderRegex1, (match, p1, p2) => {
       if (match.includes('ShareToCommunity')) return match;
       return `<div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            ${p2}
          </div>
          <ShareToCommunity text="Découvrez cet outil : ${title}" />
        </div>`;
    });
    
    // For tools using Link to /tools
    content = content.replace(/(<div className="mb-8 relative flex flex-col items-center justify-center text-center">)\s*(<Link to="\/tools"[\s\S]*?<\/Link>\s*<h1[^>]*>.*?<\/h1>[\s\S]*?)<\/div>/, (match, p1, p2) => {
       if (match.includes('ShareToCommunity')) return match;
       return `<div className="mb-8 relative flex items-center pt-8 justify-center text-center">
          ${p2}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
             <ShareToCommunity text="Découvrez cet outil : ${title}" />
          </div>
        </div>`;
    });

    // Special case for Habit Tracker / etc
    // <div className="mb-8 relative flex flex-col items-center justify-center text-center">
    
    fs.writeFileSync(filePath, content);
    console.log('Modified', file);
  }
});
