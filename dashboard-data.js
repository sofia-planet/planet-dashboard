const https = require('https');

const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = 'appTCR9CFFn3y2Lgq';
const TABLE_ID = 'tblku4UydCySa4fvd';

const F = {
  name:     'fldlwjCtxUwD2OtaS',
  status:   'fldNQrpQMJCiwE1Tr',
  email:    'fldt5FDjRt9QIQSwX',
  location: 'fld11DfUijW5i6RVZ',
  channel:  'fld0MRgRZgHc5I6sv',
  date:     'fldp648BxV5MKWA1N',
  notes:    'fldBoECgjy8cQMABM'
};

function atGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.airtable.com',
      path, method: 'GET',
      headers: { 'Authorization': 'Bearer ' + AT_TOKEN }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getAllRecords() {
  let all = [], offset = null;
  do {
    const qs = offset ? '&offset=' + offset : '';
    const result = await atGet('/v0/' + BASE_ID + '/' + TABLE_ID + '?pageSize=100' + qs);
    if (result.records) all = all.concat(result.records);
    offset = result.offset || null;
  } while (offset);
  return all;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const records = await getAllRecords();
    const today = new Date().toISOString().split('T')[0];
    const counts = { 'Active Partner': 0, 'Call Scheduled': 0, 'Interested': 0, 'Contacted': 0, 'Passed': 0 };
    let todayOutreach = 0;
    const activePartners = [], callsScheduled = [], interested = [], passed = [], allContacts = [];

    records.forEach(r => {
      const p = r.fields;
      const name     = p[F.name] || '';
      const status   = p[F.status] || 'Contacted';
      const email    = p[F.email] || '';
      const location = p[F.location] || '';
      const channel  = p[F.channel] || '';
      const date     = p[F.date] || '';
      const notes    = p[F.notes] || '';

      if (counts[status] !== undefined) counts[status]++;
      if (date === today) todayOutreach++;

      allContacts.push({ name, status, email, location, channel, date, note: notes });
      if (status === 'Active Partner') activePartners.push({ name, note: notes });
      if (status === 'Call Scheduled') callsScheduled.push({ name, detail: notes.substring(0,60) });
      if (status === 'Interested') interested.push({ name, detail: notes.substring(0,50) });
      if (status === 'Passed') passed.push({ name, note: notes.substring(0,50) });
    });

    const locMap = {};
    records.forEach(r => {
      const loc = r.fields[F.location] || '';
      if (loc) {
        const state = loc.includes(',') ? loc.split(',').pop().trim() : loc.trim();
        if (state) locMap[state] = (locMap[state] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locMap).sort((a,b) => b[1]-a[1]).slice(0,7).map(([state, count]) => ({ state, count }));

    const total = records.length;
    const responses = counts['Active Partner'] + counts['Call Scheduled'] + counts['Interested'];
    const responseRate = total > 0 ? Math.round((responses / total) * 100) : 0;

    res.status(200).json({
      total, todayOutreach, responseRate,
      totalActivePartners: counts['Active Partner'],
      totalCallsScheduled: counts['Call Scheduled'],
      totalInterested: counts['Interested'],
      totalContacted: counts['Contacted'],
      totalPassed: counts['Passed'],
      activePartners, callsScheduled, interested, passed,
      topLocations, allContacts,
      recentActivity: allContacts
        .filter(c => c.date)
        .sort((a,b) => b.date.localeCompare(a.date))
        .slice(0,8)
        .map(c => ({
          name: c.name,
          action: c.note || 'Contacted',
          color: c.status === 'Active Partner' ? 'green' : c.status === 'Interested' || c.status === 'Call Scheduled' ? 'blue' : c.status === 'Passed' ? 'red' : 'stone',
          time: c.date
        }))
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
