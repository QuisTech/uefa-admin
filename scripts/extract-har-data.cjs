const fs = require('fs');
const path = require('path');

const harPath = 'C:/Users/USER/Downloads/gaming.uefa.com.har';
console.log('Extracting data from HAR:', harPath);

const har = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
const entries = har.log.entries;

const dataDir = path.resolve(process.cwd(), 'data', 'har_extracted');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function saveEntry(pattern, filename) {
  const entry = entries.find(e => e.request.url.includes(pattern) && e.response.content && e.response.content.text);
  if (entry) {
    const text = entry.response.content.text;
    const dest = path.join(dataDir, filename);
    fs.writeFileSync(dest, text, 'utf-8');
    console.log(`Saved ${filename} (${(text.length / 1024).toFixed(1)} KB)`);
    return JSON.parse(text);
  } else {
    console.warn(`Not found in HAR: ${pattern}`);
    return null;
  }
}

const players = saveEntry('players_90_en_2.json', 'players_90_en_2.json');
const teams = saveEntry('teams_90_en.json', 'teams_90_en.json');
const fixtures = saveEntry('fixtures_90_en.json', 'fixtures_90_en.json');
const constraints = saveEntry('constraints_90.json', 'constraints_90.json');
const leaders = saveEntry('Leaderboard/leaders', 'leaders_page1.json');
const worldNo1Squad = saveEntry('opponent-team', 'world_no1_bird_squad.json');

console.log('Extracted all core feeds successfully to data/har_extracted/');
