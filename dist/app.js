import {validCoordinate, distanceMeters, formatDistance} from './geo.js';
import {loadRoutes} from './routes.js';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : '#'; } catch { return '#'; } };
const kinds = {toilets:'厕所',water:'饮水',supplies:'补给'};
const activeKinds = new Set(Object.keys(kinds));
let stamps = [], facilities = [], position = null, watchId = null, selected = null, mode = 'nearby', facilityCenter = null;
let locationError = null, gpsMarker, accuracyCircle, centerOnFix = false, activeDetail = null, freshness = false;
const markers = new Map();
const params = new URLSearchParams(location.search);
const returnDay = params.get('day');
if (/^[0-5]$/.test(returnDay ?? '')) {
  $('guide-link').href = `./#day-${returnDay}`;
  $('return-guide').href = `./#day-${returnDay}`;
  $('return-guide').textContent = `返回 Day ${returnDay} 行程`;
  $('return-guide').hidden = false;
}
let routeBounds = null;
// Working map area around Wakayama/Kumano, not an administrative boundary.
const regionBounds = L.latLngBounds([33.35,134.95],[34.48,136.45]);
const inRegion = p => regionBounds.contains([p.lat,p.lng]);
const map = L.map('map', {zoomControl:false, scrollWheelZoom:true,zoomSnap:.25,maxBounds:regionBounds,maxBoundsViscosity:1}).setView([33.79,135.75], 10);
const limitRegion = () => map.setMinZoom(map.getBoundsZoom(regionBounds,true));
map.on('resize',limitRegion); limitRegion();
const sizePins = () => $('map').classList.toggle('map-overview',map.getZoom() <= 10);
map.on('zoomend',sizePins); sizePins();
L.control.zoom({position:'topright'}).addTo(map);
L.control.scale({imperial:false,position:'bottomleft'}).addTo(map);
const tiles = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {minZoom:5,maxZoom:18, attribution:'<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>'}).addTo(map);
const facilityLayer = L.layerGroup().addTo(map);
let tileFailures = 0;
function mapMessage(message) { $('map-message').textContent = message; $('map-message').hidden = !message; }
tiles.on('tileerror', () => { if (++tileFailures >= 3) mapMessage('底图未能载入，请检查网络。盖章点列表仍可使用。'); });
tiles.on('tileload', () => { if (tileFailures >= 3) mapMessage(''); tileFailures = 0; });
window.addEventListener('offline', () => mapMessage('当前离线：地图新区域无法载入，已载入的点位仍可查看。'));
window.addEventListener('online', () => { mapMessage(''); tiles.redraw(); });

function stampIcon(id) { return L.divIcon({className:'',html:`<span class="stamp-pin ${selected === id ? 'is-selected' : ''}">${id}</span>`,iconSize:[30,30],iconAnchor:[15,15]}); }
function allBounds() { const mapped = stamps.filter(p => validCoordinate(p.lat,p.lng)); if (mapped.length) { const bounds = L.latLngBounds(mapped.map(p => [p.lat,p.lng])); if (routeBounds) bounds.extend(routeBounds); map.fitBounds(bounds, {padding:[45,65],maxZoom:11,animate:false}); } }
function freshPosition() { return position && Date.now() - position.timestamp < 120000 && !locationError && watchId !== null; }
function renderPoints() {
  freshness = Boolean(freshPosition());
  const near = mode === 'nearby' && position;
  const list = near ? stamps.filter(p => validCoordinate(p.lat,p.lng)).map(p => ({...p,distance:distanceMeters(position,p)})).sort((a,b) => a.distance-b.distance).slice(0,8) : stamps;
  $('tab-nearby').setAttribute('aria-pressed',String(mode === 'nearby'));
  $('tab-all').setAttribute('aria-pressed',String(mode === 'all'));
  $('tab-facilities').setAttribute('aria-pressed',String(mode === 'facilities'));
  document.querySelector('.points-section').hidden = mode === 'facilities';
  document.querySelector('.amenities').hidden = mode !== 'facilities';
  $('list-title').textContent = near ? '离你最近的盖章点' : mode === 'all' ? '41 章 · 官方编号顺序' : '从第一枚章开始';
  $('list-count').textContent = near ? '最近 8 处' : `${stamps.length} 处`;
  $('list-hint').textContent = near ? `${freshPosition() ? '' : '按上次位置排序 · '}${list[0]?.distance > 30000 ? '你目前远离中边路。' : ''}按直线距离排序，不代表步行距离。` : '点选名称，在地图上查看位置与来源。';
  $('points').innerHTML = list.map(p => `<button class="point-row ${selected === p.id ? 'selected' : ''}" type="button" data-stamp="${p.id}" aria-label="第${p.id}章 ${escape(p.name)}"><span class="point-number">${String(p.id).padStart(2,'0')}</span><span><span class="point-name" lang="ja">${escape(p.name)}</span><span class="point-meta">${escape(p.section)}${validCoordinate(p.lat,p.lng) ? '' : ' · 坐标待核实'}</span></span><span class="point-distance">${position && validCoordinate(p.lat,p.lng) ? formatDistance(distanceMeters(position,p)) : ''}</span></button>`).join('');
}
function showDetail(p, stamp = true) {
  activeDetail = {p,stamp};
  const located = validCoordinate(p.lat,p.lng);
  $('detail').hidden = false;
  $('detail').innerHTML = `<div class="detail-top"><h2>${stamp ? `${String(p.id).padStart(2,'0')} · ` : ''}${escape(p.name)}</h2><button type="button" class="detail-close" id="close-detail" aria-label="关闭点位详情">收起</button></div><p>${stamp ? escape(p.section) : escape(kinds[p.kind])}${position && located ? ` · 距${freshPosition() ? '你' : '上次位置'} ${formatDistance(distanceMeters(position,p))}（直线）` : ''}</p><p>${escape(p.coordinateNote || p.note || '地图参考位置，请以现场情况为准。')}</p>${located ? `<p class="coordinates">${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}</p>` : ''}${p.hours ? `<p>标注营业时间：${escape(p.hours)}</p>` : ''}<a href="${safeUrl(p.coordinateSourceUrl || p.sourceUrl)}" target="_blank" rel="noopener">查看来源</a>${located ? `<a href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" target="_blank" rel="noopener">在 Google 地图查看</a>` : ''}`;
  $('close-detail').onclick = () => { $('detail').hidden = true; activeDetail = null; selected = null; updateSelected(); };
}
function updateSelected() { for (const [id,m] of markers) m.setIcon(stampIcon(id)); renderPoints(); }
function selectStamp(id) {
  const p = stamps.find(p => p.id === id); if (!p) throw new Error('盖章点编号无效');
  selected = id; updateSelected(); showDetail(p);
  if (validCoordinate(p.lat,p.lng)) {
    const adjacent = stamps.some(other => other.id !== id && validCoordinate(other.lat,other.lng) && distanceMeters(p,other) < 150);
    map.setView([p.lat,p.lng],Math.max(adjacent ? 17 : 15,map.getZoom()),{animate:false});
  }
  document.querySelector('.sidebar').scrollTop = 0;
  if (matchMedia('(max-width:760px)').matches) window.scrollTo(0,0);
  return {id:p.id,name:p.name,lat:p.lat,lng:p.lng};
}
$('points').addEventListener('click', e => { const row = e.target.closest('[data-stamp]'); if (row) selectStamp(Number(row.dataset.stamp)); });
$('overview').onclick = allBounds;
for (const tab of ['nearby','all','facilities']) $(`tab-${tab}`).onclick = () => { mode = tab; renderPoints(); if (tab === 'facilities' && !$('load-amenities').disabled) $('load-amenities').click(); };

function renderLocation() {
  if (activeDetail) showDetail(activeDetail.p,activeDetail.stamp);
  const state = $('gps-state'), description = $('gps-description');
  $('stop-location').hidden = watchId === null;
  if (locationError) { state.textContent = '定位不可用'; state.className = 'status error'; description.textContent = locationError; return; }
  if (!position) return;
  const stale = !freshPosition();
  state.textContent = stale ? '上次位置' : '定位中'; state.className = `status ${stale ? 'error' : 'active'}`;
  const age = Math.max(0,Math.floor((Date.now()-position.timestamp)/60000));
  description.textContent = `${stale ? `上次更新${age ? `于 ${age} 分钟前` : ''} · ` : ''}精度约 ±${Math.round(position.accuracy)} m${position.accuracy > 100 ? '，当前信号较弱' : ''}。${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}${inRegion(position) ? '' : '。你目前在地图范围外，地图保留在熊野古道；仍可按距离查看章点。'}`;
  if (!stale) $('locate').querySelector('span').textContent = inRegion(position) ? '定位到我' : '查看中边路';
  if (gpsMarker) gpsMarker.setOpacity(stale ? .5 : 1);
}
function onPosition(result) {
  const {latitude:lat,longitude:lng,accuracy} = result.coords;
  if (!validCoordinate(lat,lng) || !Number.isFinite(accuracy) || accuracy < 0 || !Number.isFinite(result.timestamp)) return;
  position = {lat,lng,accuracy,timestamp:result.timestamp}; locationError = null;
  if (!gpsMarker) {
    accuracyCircle = L.circle([lat,lng],{radius:accuracy,color:'#216ed1',weight:1,fillColor:'#216ed1',fillOpacity:.10,interactive:false}).addTo(map);
    gpsMarker = L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="you-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:1000,title:'我的位置'}).addTo(map).bindTooltip('我的位置');
  } else { gpsMarker.setLatLng([lat,lng]); accuracyCircle.setLatLng([lat,lng]).setRadius(accuracy); }
  if (centerOnFix) { if (inRegion(position)) map.setView([lat,lng],accuracy > 1000 ? 12 : 15); else allBounds(); centerOnFix = false; }
  $('locate').disabled = false; $('locate').querySelector('span').textContent = '定位到我';
  renderLocation(); renderPoints();
}
function onLocationError(error) {
  locationError = ({1:'定位权限未开启。请在浏览器的网站设置中允许位置访问，再点“定位到我”。',2:'暂时无法取得位置，请到信号较好的地方重试。',3:'定位超时，请再次点击“定位到我”。'}[error.code]) || '暂时无法定位，请稍后重试。';
  if (error.code === 1) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null; centerOnFix = false;
  }
  if (gpsMarker) gpsMarker.setOpacity(.5);
  $('locate').disabled = false; $('locate').querySelector('span').textContent = '重新定位'; renderLocation(); renderPoints();
}
$('locate').onclick = () => {
  if (!window.isSecureContext || !navigator.geolocation) { onLocationError({message:'unsupported'}); locationError = '定位需要 HTTPS 或本机 localhost，并使用支持定位的浏览器。'; renderLocation(); return; }
  if (freshPosition()) { if (inRegion(position)) map.setView([position.lat,position.lng],15); else allBounds(); return; }
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  locationError = null; centerOnFix = true;
  $('gps-state').textContent = '正在定位'; $('gps-state').className = 'status'; $('gps-description').textContent = '请允许浏览器访问位置；首次定位可能需要一些时间。';
  $('locate').disabled = true; $('locate').querySelector('span').textContent = '正在定位…';
  watchId = navigator.geolocation.watchPosition(onPosition,onLocationError,{enableHighAccuracy:true,timeout:20000,maximumAge:10000});
  $('stop-location').hidden = false;
};
$('stop-location').onclick = () => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null; locationError = null; centerOnFix = false; $('locate').disabled = false; $('locate').querySelector('span').textContent = '定位到我';
  if (!position) { $('gps-state').textContent = '已停止'; $('gps-description').textContent = '已停止请求位置，可随时重新定位。'; $('stop-location').hidden = true; }
  renderLocation(); renderPoints();
};
setInterval(() => { renderLocation(); const fresh = Boolean(freshPosition()); if (fresh !== freshness) { freshness = fresh; renderPoints(); } },15000);
window.addEventListener('pagehide', () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); watchId = null; });
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  $('locate').disabled = false; $('locate').querySelector('span').textContent = '定位到我'; centerOnFix = false;
  if (!position) { $('gps-state').textContent = '未定位'; $('gps-description').textContent = '点击“定位到我”重新开启定位。'; }
  renderLocation(); renderPoints();
});

function renderFacilities() {
  facilityLayer.clearLayers(); if (!facilityCenter) return;
  const found = facilities.filter(p => activeKinds.has(p.kind) && distanceMeters(facilityCenter,p) <= 3000).map(p => ({...p,distance:distanceMeters(facilityCenter,p)})).sort((a,b) => a.distance-b.distance);
  for (const p of found) {
    L.marker([p.lat,p.lng],{title:p.name,icon:L.divIcon({className:'',html:`<span class="facility-pin ${p.kind}">${{toilets:'厕',water:'水',supplies:'补'}[p.kind]}</span>`,iconSize:[30,30],iconAnchor:[15,15]})}).addTo(facilityLayer).bindTooltip(escape(p.name)).on('click',() => showDetail(p,false));
  }
  $('amenity-status').textContent = found.length ? `查询中心 3 km 内，资料收录 ${found.length} 处。距离按查询中心计算，地图移动后请重新查询。` : activeKinds.size ? '此范围内暂无已收录设施，不代表现场没有。可移动地图后重新查询。' : '请至少选择一种设施类型。';
  $('amenity-list').innerHTML = found.map(p => `<button class="amenity-row" type="button" data-facility="${escape(p.id)}">${escape(p.name)}<small>${kinds[p.kind]} · ${formatDistance(p.distance)} · ${escape(p.provider || '公开地图')}</small></button>`).join('');
}
for (const button of document.querySelectorAll('[data-kind]')) button.onclick = () => { const kind = button.dataset.kind; activeKinds.has(kind) ? activeKinds.delete(kind) : activeKinds.add(kind); button.setAttribute('aria-pressed',String(activeKinds.has(kind))); renderFacilities(); };
$('load-amenities').onclick = () => { const center = map.getCenter(); facilityCenter = {lat:center.lat,lng:center.lng}; renderFacilities(); };
function selectFacility(id) {
  const p = facilities.find(f => f.id === id);
  if (!p) return false;
  selected = null; updateSelected();
  showDetail(p,false); map.setView([p.lat,p.lng],16,{animate:false});
  facilityCenter = {lat:p.lat,lng:p.lng}; renderFacilities();
  return true;
}
$('amenity-list').onclick = e => { const row = e.target.closest('[data-facility]'); if (row) selectFacility(row.dataset.facility); };

async function init() {
  try {
    const response = await fetch('./stamps.json'); if (!response.ok) throw new Error('stamps');
    const data = await response.json();
    if (!Array.isArray(data) || data.length !== 41 || new Set(data.map(p=>p.id)).size !== 41 || data.some(p=>!Number.isInteger(p.id)||p.id<1||p.id>41||typeof p.name!=='string')) throw new Error('invalid stamps');
    stamps = data;
    for (const p of stamps) if (validCoordinate(p.lat,p.lng)) markers.set(p.id,L.marker([p.lat,p.lng],{icon:stampIcon(p.id),title:`${p.id} ${p.name}`,keyboard:true}).addTo(map).bindTooltip(`${p.id} · ${escape(p.name)}`).on('click',()=>selectStamp(p.id)));
    $('coordinate-coverage').textContent = `41 章中 ${markers.size} 处已收录有来源的地点坐标；坐标用于寻找该地点，不代表章箱精确位置。每处详情可查看坐标来源。`;
    allBounds(); renderPoints();
    if (params.has('stamp')) {
      const id=Number(params.get('stamp'));
      if (Number.isInteger(id) && id>=1 && id<=41) selectStamp(id);
      else mapMessage('章点链接无效，请从列表选择。');
    }
    if (params.get('facilities')==='1' || params.has('facility')) { mode='facilities'; renderPoints(); }
  } catch { $('points').innerHTML = '<p class="hint">盖章点载入失败，请检查网络后刷新。也可回到攻略打开官方押印地图。</p>'; }
  try {
    const response = await fetch('./amenities.json'); if (!response.ok) throw new Error('facilities');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('invalid facilities');
    facilities = data.filter(p => typeof p.id === 'string' && typeof p.name === 'string' && Object.hasOwn(kinds,p.kind) && validCoordinate(p.lat,p.lng));
    $('load-amenities').disabled = false;
    $('amenity-status').textContent = '资料可能有遗漏；饮水需向设施工作人员询问，供应与营业情况以现场为准。';
    if (params.has('facility')) {
      if (!selectFacility(params.get('facility'))) { mapMessage('设施链接无效，请在地图上重新查询。'); $('load-amenities').click(); }
    } else if (mode === 'facilities') $('load-amenities').click();
    else renderFacilities();
  } catch { $('load-amenities').disabled = true; $('amenity-status').textContent = '设施资料载入失败，请检查网络后刷新。'; }
  if (document.modelContext?.registerTool) {
    try { await document.modelContext.registerTool({name:'select_kumano_stamp',description:'按官方编号在地图中选中熊野古道盖章点并展示详情；不会请求或返回用户定位。',inputSchema:{type:'object',properties:{id:{type:'integer',minimum:1,maximum:41}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if (!input || Object.keys(input).some(k=>k!=='id') || !Number.isInteger(input.id) || input.id<1 || input.id>41) throw new Error('id 必须是 1 到 41 的整数');return selectStamp(input.id);}}); } catch { /* Optional browser API; the visible map works without it. */ }
  }
}
init();
loadRoutes(map).then(bounds => { routeBounds = bounds; if (!position && !activeDetail) allBounds(); });
