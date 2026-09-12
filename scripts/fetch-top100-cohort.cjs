const fs = require('fs');
const path = require('path');
const axios = require('axios');

const userGuid = '146242f4-adcf-11f1-820b-916aae5300aa';

function encodeUefaName(name) {
  return Array.from(name || '')
    .map(c => c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('--- FETCHING TOP 100 LIVE ELITE MANAGERS FROM UEFA ---');
  
  // Step 1: Fetch Top 100 Leaders from Leaderboard API
  const leaders = [];
  for (let page = 1; page <= 5; page++) {
    console.log(`Fetching leaderboard page ${page}...`);
    const res = await axios.get(
      `https://gaming.uefa.com/en/uclfantasy/services/api//Leaderboard/leaders?optType=1&phaseId=0&matchdayId=0&vPageChunk=25&vPageNo=${page}`,
      {
        timeout: 15000,
        headers: {
          'entity': 'ed0t4n$3!',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        }
      }
    );
    const list = res.data?.data?.value?.userInfo || [];
    leaders.push(...list);
    if (leaders.length >= 100) break;
    await sleep(200);
  }

  const top100Leaders = leaders.slice(0, 100);
  console.log(`Successfully fetched ${top100Leaders.length} leaders from UEFA leaderboard.`);

  // Step 2: Concurrently fetch squad for each of the 100 leaders
  console.log('Fetching live 15-man squads for all 100 leaders (concurrency = 4)...');
  const verifiedCohort = [];
  const concurrency = 4;
  
  for (let i = 0; i < top100Leaders.length; i += concurrency) {
    const chunk = top100Leaders.slice(i, i + concurrency);
    const promises = chunk.map(async (leader, idxInChunk) => {
      const globalIdx = i + idxInChunk;
      const rank = leader.rank || globalIdx + 1;
      const managerName = leader.fullName || `Manager ${globalIdx + 1}`;
      const teamName = leader.teamName || `Team ${globalIdx + 1}`;
      const totalPoints = leader.overallPoints || 0;
      const oppGuid = leader.guid;
      const entryId = 88255 + globalIdx;
      const uefaUrl = `https://gaming.uefa.com/en/uclfantasy/team/${oppGuid}/${encodeUefaName(managerName || teamName)}/0/0/0/Worldleaderboard?typeId=0031`;

      try {
        const squadRes = await axios.get(
          `https://gaming.uefa.com/en/uclfantasy/services/api/Gameplay/user/${userGuid}/opponent-team?matchdayId=1&phaseId=1&opponentguid=${oppGuid}`,
          {
            timeout: 15000,
            headers: {
              'entity': 'ed0t4n$3!',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept': 'application/json'
            }
          }
        );

        const val = squadRes.data?.data?.value;
        if (!val || !val.playerid || val.playerid.length === 0) {
          console.warn(`[WARN] Squad not returned for #${globalIdx + 1} (${managerName})`);
          return null;
        }

        const rawPlayers = val.playerid;
        const starters = rawPlayers.filter(p => p.benchposition === 0);
        const bench = rawPlayers.filter(p => p.benchposition > 0).sort((a, b) => a.benchposition - b.benchposition);
        
        let captainId = val.captplayerid;
        if (!captainId || captainId === 0) {
          const foundCap = rawPlayers.find(p => p.iscaptain === 1);
          captainId = foundCap ? foundCap.id : (starters[0]?.id || 0);
        }

        const squadIds = [...starters.map(p => p.id), ...bench.map(p => p.id)];

        // Check chips / boosters
        const chipsUsed = [];
        let chipDeduction = 0;
        let isChipNormalized = false;

        if (val.isBoosterOneTaken && val.boosterOneMdID === 1) {
          chipsUsed.push({ name: 'booster', time: 'MD1', event: 1 });
          // Deduct 3rd captain boost or bench boost if applicable
          chipDeduction = 12;
          isChipNormalized = true;
        }
        if (val.isWildCard && val.userWildCardMatchday === 1) {
          chipsUsed.push({ name: 'wildcard', time: 'MD1', event: 1 });
          chipDeduction = 15;
          isChipNormalized = true;
        }

        const normalizedPoints = Math.max(0, totalPoints - chipDeduction);

        return {
          rank,
          entry: entryId,
          guid: oppGuid,
          uefa_url: uefaUrl,
          manager_name: managerName,
          team_name: teamName,
          total_points: totalPoints,
          normalized_total_points: normalizedPoints,
          chip_deduction: chipDeduction,
          is_chip_normalized: isChipNormalized,
          chips_used: chipsUsed,
          captainId,
          squad: squadIds
        };
      } catch (err) {
        console.error(`[ERR] Failed to fetch squad for #${globalIdx + 1} (${managerName}):`, err.message);
        return null;
      }
    });

    const results = await Promise.all(promises);
    results.forEach(r => {
      if (r) verifiedCohort.push(r);
    });

    console.log(`Progress: ${verifiedCohort.length}/100 managers fetched.`);
    await sleep(150);
  }

  console.log(`\nSuccessfully compiled ${verifiedCohort.length} fully verified elite managers.`);

  // Save to file
  const outPath = path.resolve(process.cwd(), 'data', 'har_extracted', 'top100_verified_live_squads.json');
  fs.writeFileSync(outPath, JSON.stringify(verifiedCohort, null, 2), 'utf-8');
  console.log(`Saved cohort to ${outPath}`);

  const pureCount = verifiedCohort.filter(m => (!m.chips_used || m.chips_used.length === 0) && !m.chip_deduction).length;
  const normCount = verifiedCohort.filter(m => m.chip_deduction && m.chip_deduction > 0).length;
  console.log(`Pure 0-Chips: ${pureCount} | Chip-Normalized: ${normCount}`);
}

main().catch(err => console.error('Fatal error:', err));
