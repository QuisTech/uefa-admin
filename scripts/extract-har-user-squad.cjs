const fs = require('fs');
const path = require('path');

function parseHarUserSquad(harFilePath) {
  if (!fs.existsSync(harFilePath)) {
    console.error(`HAR file not found: ${harFilePath}`);
    return null;
  }

  console.log(`Reading HAR file from: ${harFilePath}...`);
  const raw = fs.readFileSync(harFilePath, 'utf-8');
  const har = JSON.parse(raw);
  const entries = har.log?.entries || [];

  console.log(`Scanning ${entries.length} HAR entries...`);

  let foundSquad = null;

  for (const entry of entries) {
    const url = entry.request?.url || '';
    const text = entry.response?.content?.text || '';

    // Check for UEFA Gameplay user team endpoints
    if (url.includes('/Gameplay/') && (url.includes('team') || url.includes('squad') || url.includes('player'))) {
      try {
        const json = JSON.parse(text);
        const val = json?.data?.value;
        if (val) {
          const players = val.playerData || val.playerList || val.squad || val.players || [];
          if (Array.isArray(players) && players.length > 0) {
            const teamName = val.teamName || val.name || 'User Team';
            const username = val.username || val.managerName || 'User';
            const playerIds = players.map(p => typeof p === 'object' ? p.id || p.playerId || p.playerid : p).filter(Boolean);
            const captId = val.captplayerid || (players.find(p => p.iscaptain === 1 || p.isCaptain === 1)?.id);

            foundSquad = {
              teamName,
              username,
              playerIds,
              captainId: captId,
              url
            };
            break;
          }
        }
      } catch (err) {
        // Continue searching
      }
    }
  }

  return foundSquad;
}

// Check for default HAR file paths
const targetHar = process.argv[2] || 'c:/Users/USER/Downloads/gaming.uefa.com.har';
const squad = parseHarUserSquad(targetHar);

if (squad) {
  console.log('\n✅ Successfully extracted user squad from HAR!');
  console.log(`Team Name: ${squad.teamName}`);
  console.log(`Username: ${squad.username}`);
  console.log(`Squad Player Count: ${squad.playerIds.length}`);
  console.log(`Player IDs:`, squad.playerIds);
  console.log(`Captain ID:`, squad.captainId);
} else {
  console.log('\n⚠️ No squad player list found in HAR yet. Ensure you visit "My Team" page while capturing HAR.');
}

module.exports = { parseHarUserSquad };
