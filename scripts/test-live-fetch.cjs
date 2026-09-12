const axios = require('axios');

async function testFetch() {
  try {
    console.log('1. Testing public players feed...');
    const r1 = await axios.get('https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_90_en_2.json', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('-> Public player feed status:', r1.status, '| Players count:', r1.data?.data?.value?.playerList?.length);

    console.log('\n2. Testing private leaderboard endpoint with entity header...');
    const r2 = await axios.get('https://gaming.uefa.com/en/uclfantasy/services/api//Leaderboard/leaders?optType=1&phaseId=0&matchdayId=0&vPageChunk=10&vPageNo=1', {
      timeout: 10000,
      headers: {
        'entity': 'ed0t4n$3!',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });
    console.log('-> Leaderboard status:', r2.status, '| Leaders count:', r2.data?.data?.value?.userInfo?.length);
    if (r2.data?.data?.value?.userInfo) {
      console.log('   #1 Leader:', r2.data.data.value.userInfo[0].fullName, '(' + r2.data.data.value.userInfo[0].teamName + ') -', r2.data.data.value.userInfo[0].overallPoints, 'pts');
    }

    console.log('\n3. Testing opponent squad endpoint with entity header...');
    const userGuid = '146242f4-adcf-11f1-820b-916aae5300aa';
    const oppGuid = '0aba30ba-aa35-11f1-831c-0f22566c6f8d'; // biRD
    const r3 = await axios.get('https://gaming.uefa.com/en/uclfantasy/services/api/Gameplay/user/' + userGuid + '/opponent-team?matchdayId=1&phaseId=1&opponentguid=' + oppGuid, {
      timeout: 10000,
      headers: {
        'entity': 'ed0t4n$3!',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });
    console.log('-> Opponent squad status:', r3.status, '| Squad players count:', r3.data?.data?.value?.playerid?.length);
    console.log('\nALL 3 AUTOMATED ENDPOINTS WORKING LIVE!');
  } catch (err) {
    console.error('Test failed:', err.message, err.response?.status, err.response?.data);
  }
}

testFetch();
