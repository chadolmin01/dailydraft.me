import https from 'https';

function post(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      path: '/' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // 1. 새 이벤트 생성
  const createBody = 'NewEventName=TestBot2&DateTypes=SpecificDates&PossibleDates=20260414|20260415|20260416|20260417|20260418&NoEarlierThan=9&NoLaterThan=22&TimeZone=Asia%2FSeoul';
  const createRes = await post('www.when2meet.com', 'SaveNewEvent.php', createBody);

  const eventMatch = createRes.data.match(/\?(\d+-\w+)/);
  if (!eventMatch) {
    console.log('Failed to create event');
    console.log(createRes.data.substring(0, 300));
    return;
  }

  const eventUrl = eventMatch[1];
  const parts = eventUrl.split('-');
  const eventId = parts[0];
  const eventCode = parts.slice(1).join('-');
  console.log('Created event:', eventUrl);

  // 2. 그리드 로드 (빈 상태)
  const gridBody = `${eventUrl}&id=${eventId}&code=${eventCode}&participantTimeZone=Asia%2FSeoul`;
  const gridRes = await post('www.when2meet.com', 'AvailabilityGrids.php', gridBody);
  console.log('\nGrid status:', gridRes.status, '| length:', gridRes.data.length);

  // TimeOfSlot 추출
  const slotMatches = [...gridRes.data.matchAll(/TimeOfSlot\[(\d+)\]=(\d+)/g)];
  console.log('TimeOfSlot entries:', slotMatches.length);

  if (slotMatches.length === 0) {
    console.log('\nRaw grid response:');
    console.log(gridRes.data.substring(0, 3000));
    return;
  }

  // 슬롯 정보 출력
  const slots = slotMatches.map(m => ({ idx: parseInt(m[1]), ts: parseInt(m[2]) }));
  console.log('\nFirst 10 slots:');
  slots.slice(0, 10).forEach(s => {
    const d = new Date(s.ts * 1000);
    console.log(`  [${s.idx}] ${s.ts} -> ${d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  });

  // 3. 5명 로그인 + 가용시간 설정
  const names = ['민준', '서연', '지호', '하은', '도윤'];
  const users = [];

  for (const name of names) {
    const loginBody = `id=${eventId}&name=${encodeURIComponent(name)}&password=test123`;
    const loginRes = await post('www.when2meet.com', 'ProcessLogin.php', loginBody);
    const userId = loginRes.data.trim();
    users.push({ name, id: userId });
    console.log(`\nLogged in ${name} -> ${userId}`);
  }

  // 가용시간 시나리오 (슬롯 인덱스 기반)
  // 하루 = 13시간 * 4슬롯 = 52슬롯
  // 날짜별 슬롯: 0-51(월), 52-103(화), 104-155(수), 156-207(목), 208-259(금)
  const slotsPerDay = Math.floor(slots.length / 5);
  console.log('\nSlots per day:', slotsPerDay);

  function getDaySlots(dayIdx) {
    const start = dayIdx * slotsPerDay;
    // 저녁시간만 (9시간 후 = 36슬롯 후부터 끝까지)
    const eveningStart = start + Math.floor(slotsPerDay * 0.7); // 약 18시부터
    return slots.slice(eveningStart, start + slotsPerDay).map(s => s.ts);
  }

  // 민준: 월,수,금 저녁 / 서연: 화,수,금 / 지호: 월,화,금 / 하은: 수,목,금 / 도윤: 화,금
  const availability = [
    [0, 2, 4],  // 민준
    [1, 2, 4],  // 서연
    [0, 1, 4],  // 지호
    [2, 3, 4],  // 하은
    [1, 4],     // 도윤
  ];

  for (let i = 0; i < users.length; i++) {
    const userSlots = availability[i].flatMap(d => getDaySlots(d));
    const allSlotTs = slots.map(s => s.ts);
    const binaryAvail = allSlotTs.map(ts => userSlots.includes(ts) ? '1' : '0').join('');

    const saveBody = `person=${users[i].id}&event=${eventId}&slots=${userSlots.join(',')}&availability=${binaryAvail}&password=test123&ChangeToAvailable=true`;
    const saveRes = await post('www.when2meet.com', 'SaveTimes.php', saveBody);
    console.log(`Saved ${users[i].name}: ${userSlots.length} slots, response: "${saveRes.data.substring(0, 50) || '(empty)'}"`);
  }

  // 4. 다시 그리드 로드 (데이터 포함)
  const gridRes2 = await post('www.when2meet.com', 'AvailabilityGrids.php', gridBody);
  console.log('\n--- FINAL GRID ---');
  console.log('Length:', gridRes2.data.length);

  // PeopleNames/IDs 추출
  const nameMatches = [...gridRes2.data.matchAll(/PeopleNames\[(\d+)\]\s*=\s*'([^']+)'/g)];
  const idMatches = [...gridRes2.data.matchAll(/PeopleIDs\[(\d+)\]\s*=\s*(\d+)/g)];
  console.log('\nPeople found:', nameMatches.length);
  nameMatches.forEach(m => console.log(`  ${m[2]}`));

  // AvailableAtSlot 추출
  const availSlotMatches = [...gridRes2.data.matchAll(/AvailableAtSlot\[(\d+)\]\.push\((\d+)\)/g)];
  console.log('\nAvailability entries:', availSlotMatches.length);

  // 최적 시간 계산
  if (availSlotMatches.length > 0) {
    const slotCounts = {};
    availSlotMatches.forEach(m => {
      const slotIdx = m[1];
      slotCounts[slotIdx] = (slotCounts[slotIdx] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(slotCounts));
    console.log('\n=== 최적 시간 계산 ===');
    console.log(`최대 ${maxCount}명 가능한 슬롯:`);

    const bestSlots = Object.entries(slotCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([idx, count]) => {
        const slot = slots[parseInt(idx)];
        if (slot) {
          const d = new Date(slot.ts * 1000);
          return { idx, count, date: d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) };
        }
        return null;
      })
      .filter(Boolean);

    bestSlots.forEach(s => console.log(`  ${s.date} (${s.count}명)`));
  }

  // Raw 응답 일부 출력
  console.log('\n--- Raw grid (first 2000) ---');
  console.log(gridRes2.data.substring(0, 2000));
}

main().catch(console.error);
