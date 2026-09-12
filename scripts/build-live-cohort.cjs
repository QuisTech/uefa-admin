const fs = require('fs');
const squads = JSON.parse(fs.readFileSync('data/har_extracted/top10_verified_live_squads.json', 'utf-8'));

function encodeUefaName(name) {
  return Array.from(name)
    .map(c => c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

const lines = squads.map((s, idx) => {
  const starters = s.squad_raw.filter(p => p.benchposition === 0);
  const bench = s.squad_raw.filter(p => p.benchposition > 0).sort((a,b) => a.benchposition - b.benchposition);
  let captain = starters.reduce((max, p) => (p.overallpoints > max.overallpoints ? p : max), starters[0]);
  
  const squadIds = [...starters.map(p => p.id), ...bench.map(p => p.id)];
  const entryId = 88255 + idx;
  const url = 'https://gaming.uefa.com/en/uclfantasy/team/' + s.guid + '/' + encodeUefaName(s.manager_name || s.team_name) + '/0/0/0/Worldleaderboard?typeId=0031';
  
  return '    { rank: ' + s.rank + ', entry: ' + entryId + ', guid: "' + s.guid + '", uefa_url: "' + url + '", manager_name: "' + s.manager_name + '", team_name: "' + s.team_name + '", total_points: ' + s.total_points + ', normalized_total_points: ' + s.total_points + ', chip_deduction: 0, chips_used: [], captainId: ' + captain.id + ', squad: ' + JSON.stringify(squadIds) + ' },';
});

console.log(lines.join('\n'));
