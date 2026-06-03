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
  return new Promise(function(resolve, reject) {
    var req = https.request({
      hostname: 'api.airtable.com',
      path: path,
      method: 'GET',
      headers: { Authorization: 'Bearer ' + AT_TOKEN }
    }, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getAllRecords() {
  var all = [];
  var offset = null;
  do {
    var qs = offset ? ('&offset=' + offset) : '';
    var result = await atGet('/v0/' + BASE_ID + '/' + TABLE_ID + '?pageSize=100' + qs);
    if (result.records) all = all.concat(result.records);
    offset = result.offset || null;
  } while (offset);
  return all;
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  var records;
  try {
    records = await getAllRecords();
  } catch(e) {
    res.status(500).json({ error: e.message });
    return;
  }

  var today = new Date().toISOString().split('T')[0];
  var counts = { 'Active Partner': 0, 'Call Scheduled': 0, 'Interested': 0, 'Contacted': 0, 'Passed': 0 };
  var todayOutreach = 0;
  var activePartners = [];
  var callsScheduled = [];
  var interested = [];
  var passed = [];
  var allContacts = [];

  records.forEach(function(r) {
    var p = r.fields;
    var name     = p[F.name] || '';
    var status   = p[F.status] || 'Contacted';
    var email    = p[F.email] || '';
    var location = p[F.location] || '';
    var channel  = p[F.channel] || '';
    var date     = p[F.date] || '';
    var notes    = p[F.notes] || '';

    if (counts[status] !== undefined) counts[status]++;
    if (date === today) todayOutreach++;

    allContacts.push({ name: name, status: status, email: email, location: location, channel: channel, date: date, note: notes });
    if (status === 'Active Partner') activePartners.push({ name: name, note: notes });
    if (status === 'Call Scheduled') callsScheduled.push({ name: name, detail: notes.substring(0,60) });
    if (status === 'Interested') interested.push({ name: name, detail: notes.substring(0,50) });
    if (status === 'Passed') passed.push({ name: name, note: notes.substring(0,50) });
  });

  var locMap = {};
  records.forEach(function(r) {
    var loc = r.fields[F.location] || '';
    if (loc) {
      var state = loc.indexOf(',') > -1 ? loc.split(',').pop().trim() : loc.trim();
      if (state) locMap[state] = (locMap[state] || 0) + 1;
    }
  });
  var topLocations = Object.entries(locMap).sort(function(a,b) { return b[1]-a[1]; }).slice(0,7).map(function(x) { return { state: x[0], count: x[1] }; });

  var total = records.length;
  var responses = counts['Active Partner'] + counts['Call Scheduled'] + counts['Interested'];
  var responseRate = total > 0 ? Math.round((responses / total) * 100) : 0;

  var recentActivity = allContacts
    .filter(function(c) { return c.date; })
    .sort(function(a,b) { return b.date.localeCompare(a.date); })
    .slice(0,8)
    .map(function(c) {
      var color = c.status === 'Active Partner' ? 'green' : (c.status === 'Interested' || c.status === 'Call Scheduled') ? 'blue' : c.status === 'Passed' ? 'red' : 'stone';
      return { name: c.name, action: c.note || 'Contacted', color: color, time: c.date };
    });

  res.status(200).json({
    total: total,
    todayOutreach: todayOutreach,
    responseRate: responseRate,
    totalActivePartners: counts['Active Partner'],
    totalCallsScheduled: counts['Call Scheduled'],
    totalInterested: counts['Interested'],
    totalContacted: counts['Contacted'],
    totalPassed: counts['Passed'],
    activePartners: activePartners,
    callsScheduled: callsScheduled,
    interested: interested,
    passed: passed,
    topLocations: topLocations,
    allContacts: allContacts,
    recentActivity: recentActivity
  });
};
