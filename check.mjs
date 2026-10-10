import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {distanceMeters,formatDistance,validCoordinate} from './dist/geo.js';
import {days,lodgings,sources} from './guide-data.mjs';
assert.equal(validCoordinate(null,135),false);
assert.equal(validCoordinate(91,135),false);
assert.equal(distanceMeters({lat:0,lng:0},{lat:0,lng:0}),0);
assert.ok(Math.abs(distanceMeters({lat:0,lng:0},{lat:0,lng:1})-111195)<5);
assert.ok(Number.isFinite(distanceMeters({lat:0,lng:0},{lat:0,lng:180})));
assert.equal(formatDistance(1234),'1.2 km');
const stamps=JSON.parse(readFileSync(new URL('./dist/stamps.json',import.meta.url)));
assert.equal(stamps.length,41); assert.equal(new Set(stamps.map(p=>p.id)).size,41);
for(const [i,p] of stamps.entries()) { assert.equal(p.id,i+1); assert.ok(p.name); assert.ok(validCoordinate(p.lat,p.lng),`missing coordinate: ${p.name}`); assert.ok(p.lat>33.5&&p.lat<34.1&&p.lng>135.3&&p.lng<136.1,`outside Kumano: ${p.name}`); assert.ok(p.coordinateSourceUrl?.startsWith('https://')); assert.ok(p.coordinateNote); }
const amenities=JSON.parse(readFileSync(new URL('./dist/amenities.json',import.meta.url)));
assert.equal(new Set(amenities.map(p=>p.id)).size,amenities.length);
for(const p of amenities) {assert.ok(validCoordinate(p.lat,p.lng));assert.ok(['toilets','water','supplies'].includes(p.kind));assert.ok(p.sourceUrl?.startsWith('https://'));}
for(const kind of ['toilets','water','supplies']) assert.ok(amenities.some(p=>p.kind===kind),`no ${kind} data`);
const routes=JSON.parse(readFileSync(new URL('./dist/routes.geojson',import.meta.url)));
assert.equal(routes.type,'FeatureCollection');
assert.equal(new Set(routes.features.map(f=>f.properties.id)).size,routes.features.length);
for(const f of routes.features) {
  assert.equal(f.geometry.type,'MultiLineString');
  assert.ok(f.properties.sourceUrl.startsWith('https://'));
  assert.ok(f.properties.sourceDate && f.properties.note);
  if(f.properties.kind==='walk') {
    assert.equal(f.geometry.coordinates.length,f.properties.sourceSegments.length);
    assert.ok(f.properties.sourceSegments.every(s=>s.isClosed===false));
  } else assert.equal(f.properties.kind,'boat');
  for(const line of f.geometry.coordinates) {
    assert.ok(line.length>=2);
    for(const [i,c] of line.entries()) {
      assert.ok(validCoordinate(c[1],c[0]) && c[0]>135.3 && c[0]<136.1 && c[1]>33.5 && c[1]<34.1);
      if(i) assert.ok(distanceMeters({lat:line[i-1][1],lng:line[i-1][0]},{lat:c[1],lng:c[0]})<500,`Suspicious jump in ${f.properties.id}`);
    }
  }
}
for(let id=24366;id<=24376;id++) assert.ok(routes.features.some(f=>f.properties.id===`yamap-${id}`));
for(const id of ['hongu-ukegawa','kowaze-koguchi']) assert.ok(routes.features.some(f=>f.properties.id===id));
const iwagami=routes.features.find(f=>f.properties.id==='yamap-24370').properties.sourceSegments.map(s=>s.id);
for(const id of [85445,173938,173937]) assert.ok(iwagami.includes(id),'Missing reopened Iwagami trail');
for(const id of [116156,116157,116158,173940,173941]) assert.ok(!iwagami.includes(id),'Closed Iwagami detour included');
const riverside=routes.features.find(f=>f.properties.id==='tanabe-riverside').properties;
assert.equal(riverside.status,'uncertain'); assert.equal(riverside.sourceNotice.isRouteAvailable,false);
const neighbors=new Map();
for(const f of routes.features.filter(f=>f.properties.kind==='walk')) for(const s of f.properties.sourceSegments) {
  for(const [a,b] of [[s.sourceRouteNodeId,s.targetRouteNodeId],[s.targetRouteNodeId,s.sourceRouteNodeId]]) {
    if(!neighbors.has(a)) neighbors.set(a,new Set()); neighbors.get(a).add(b);
  }
}
const reached=new Set(), pending=[neighbors.keys().next().value];
while(pending.length) { const n=pending.pop(); if(reached.has(n)) continue; reached.add(n); pending.push(...neighbors.get(n)); }
assert.equal(reached.size,neighbors.size,'Unexplained gap in the walking reference network');
console.log(`PASS: distance math, trust boundaries, ${stamps.length} sourced stamp coordinates, ${amenities.length} facilities`);
console.log(`PASS: ${routes.features.length} sourced route groups, independent geometry, closed-detour exclusion`);
assert.deepEqual(days.map(d=>d.id),[0,1,2,3,4,5]);
assert.deepEqual(days.flatMap(d=>d.stamps).sort((a,b)=>a-b),stamps.map(s=>s.id),'41 stamps assigned exactly once');
assert.deepEqual(days.filter(d=>d.long).map(d=>d.id),[1,2,4]);
assert.equal(days[0].stamps.length,0);
assert.equal(days.filter(d=>d.id>0 && d.overnight!==false).length,4);
assert.equal(days.filter(d=>d.overnight!==false).length,5,'Day 0 lodging is additional');
assert.equal(days[5].overnight,false,'Departure day must not silently add a fifth local night');
assert.deepEqual(days.map(d=>d.stamps.length),[0,13,9,6,1,12]);
const guide=readFileSync(new URL('./dist/index.html',import.meta.url),'utf8');
for(const d of days) {
  for(const field of ['walk','transit','fallback','check','area','time','distance']) assert.ok(d[field]);
  assert.ok(d.schedule.length>=2 && d.supplies.length>=2 && d.lodging.length>=2 && d.sources.length>=2);
  for(const id of d.lodging) assert.ok(lodgings[id]);
  for(const id of d.sources) assert.ok(sources[id]);
  assert.ok(guide.includes(`id="day-${d.id}"`));
  for(const id of d.stamps) assert.ok(guide.includes(`map.html?stamp=${id}&day=${d.id}`));
  if(d.facility) assert.ok(amenities.some(f=>f.id===d.facility));
  else if(d.id) { assert.ok(stamps.some(s=>s.id===d.amenityCenter)); assert.ok(guide.includes(`stamp=${d.amenityCenter}&facilities=1&day=${d.id}`)); }
}
for(const url of [...Object.values(sources).map(s=>s[1]),...Object.values(lodgings).map(l=>l.url)]) assert.equal(new URL(url).protocol,'https:');
assert.match(guide,/5 天 4 晚/);assert.match(guide,/5 晚住宿/);assert.match(guide,/Day 0 一晚/);
assert.match(days[1].check,/尚未获得车方确认/);assert.match(days[3].check,/尚未核实/);
assert.match(guide,/整程接驳尚未验证/);assert.match(guide,/四晚方案不包含今晚住宿/);
assert.doesNotMatch(guide,/11 天当地行程|12 晚住宿|id="day-(?:6|7|8|9|10|11)"/);
assert.equal((guide.match(/class="guide-stamp"/g)||[]).length,41);
console.log('PASS: Day 0 + 5-day guide, all 41 stamps once, 4 local nights + arrival night, transport uncertainty and source links');

assert.equal(days[4].amenityCenter,38,"Day 4 facilities must use Koguchi start, not Jizo-chaya");
assert.ok(!guide.includes('role="row"'),"Itinerary navigation must retain native links");
