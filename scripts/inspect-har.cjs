const fs = require('fs');
const path = require('path');

const harPath = 'C:/Users/USER/Downloads/gaming.uefa.com.har';
console.log('Loading HAR file from:', harPath);

const har = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
const entries = har.log.entries;

function findEntry(pattern) {
  return entries.find(e => e.request.url.includes(pattern) && e.response.content && e.response.content.text);
}

// 1. Players
const pEntry = findEntry('players_90_en_2.json');
if (pEntry) {
  const pData = JSON.parse(pEntry.response.content.text);
  const pList = pData.data?.value?.playerList || pData.playerList || pData.players || pData.data || [];
  console.log('\n--- 1. OFFICIAL PLAYERS FEED ---');
  console.log('Total players:', Array.isArray(pList) ? pList.length : 'not array');
  if (Array.isArray(pList) && pList.length > 0) {
    const sample = pList[0];
    console.log('Sample player:', {
      id: sample.id,
      name: sample.pFName + ' ' + sample.pDName,
      cCode: sample.cCode,
      skill: sample.skill,
      val: sample.val,
      pic: sample.pPic,
      pts: sample.totPts
    });
  }
}

// 2. Leaders
const lEntry = findEntry('Leaderboard/leaders');
if (lEntry) {
  const lData = JSON.parse(lEntry.response.content.text);
  const userInfo = lData.data?.value?.userInfo || [];
  console.log('\n--- 2. LIVE OFFICIAL LEADERBOARD LEADERS ---');
  console.log('Leaders count on page:', userInfo.length);
  userInfo.slice(0, 10).forEach(u => {
    console.log('Rank ' + u.rank + ': ' + u.fullName + ' (' + u.teamName + ') - ' + u.overallPoints + ' pts [GUID: ' + u.guid + ']');
  });
}

// 3. Opponent Team (World #1 Player88255)
const oEntry = findEntry('opponent-team');
if (oEntry) {
  const oData = JSON.parse(oEntry.response.content.text);
  const val = oData.data?.value || {};
  const squad = val.playerid || [];
  console.log('\n--- 3. WORLD #1 (biRD / Player88255) OFFICIAL SQUAD ---');
  console.log('Team Value: €' + val.teamValue + 'M | Bank: €' + val.teamBalance + 'M | Total Points: ' + val.ovPoints);
  console.log('Squad player count: ' + squad.length);
  
  const pEntry = findEntry('players_90_en_2.json');
  const pData = JSON.parse(pEntry.response.content.text);
  const pList = pData.data?.value?.playerList || [];
  const pMap = new Map(pList.map(p => [Number(p.id), p]));
  const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

  squad.forEach((p, i) => {
    const pl = pMap.get(Number(p.id));
    const role = p.benchposition === 0 ? 'STARTER' : ('BENCH #' + p.benchposition);
    const name = pl ? (pl.pFName + ' ' + pl.pDName) : 'Unknown';
    const team = pl ? pl.cCode : 'UNK';
    const pos = pl ? posMap[pl.skill] : 'UNK';
    console.log((i + 1) + '. [' + role + '] ' + name + ' (' + team + ') - ' + pos + ' | MD Pts: ' + p.overallpoints + ' | ID: ' + p.id);
  });
}

// 4. Constraints & Rules
const cEntry = findEntry('constraints_90.json');
if (cEntry) {
  console.log('\n--- 4. CONSTRAINTS & RULES ---');
  const cData = JSON.parse(cEntry.response.content.text);
  console.log('Constraints keys:', Object.keys(cData.data || cData));
}

// 5. Fixtures
const fEntry = findEntry('fixtures_90_en.json');
if (fEntry) {
  console.log('\n--- 5. FIXTURES FEED ---');
  const fData = JSON.parse(fEntry.response.content.text);
  const fixtures = fData.data?.value || fData.data || [];
  console.log('Total fixtures items:', Array.isArray(fixtures) ? fixtures.length : Object.keys(fixtures).length);
}
