// Each source segment stays separate: stamp numbers are not a walking itinerary.
export async function loadRoutes(map) {
  const toggle = document.getElementById('show-routes');
  const status = document.getElementById('route-status');
  const list = document.getElementById('route-list');
  const pane = map.createPane('referenceRoutes');
  pane.style.zIndex = '350';
  const layer = L.layerGroup();
  const popupOptions = {maxWidth:285,autoPanPaddingTopLeft:[16,145],autoPanPaddingBottomRight:[16,80]};
  map.on('popupopen', ({popup}) => {
    popup.options.maxHeight = Math.max(70,Math.min(220,map.getSize().y-280));
    popup.update();
  });
  let attribution = '';
  toggle.onchange = () => {
    map.closePopup();
    if (toggle.checked) { layer.addTo(map); map.attributionControl.addAttribution(attribution); }
    else { map.removeLayer(layer); map.attributionControl.removeAttribution(attribution); }
  };
  try {
    const response = await fetch('./routes.geojson');
    if (!response.ok) throw new Error('routes');
    const data = await response.json();
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length) throw new Error('routes');
    for (const f of data.features) {
      const p = f.properties, g = f.geometry;
      if (!p || typeof p.name !== 'string' || !['walk','boat'].includes(p.kind) || g?.type !== 'MultiLineString' || !g.coordinates.length) throw new Error('route');
      if (g.coordinates.some(line => !Array.isArray(line) || line.length < 2 || line.some(c => !Array.isArray(c) || !Number.isFinite(c[0]) || !Number.isFinite(c[1]) || c[0] < 135.3 || c[0] > 136.1 || c[1] < 33.5 || c[1] > 34.1))) throw new Error('geometry');
      if (!p.sourceUrl?.startsWith('https://')) throw new Error('source');
    }
    for (const f of data.features) {
      const p = f.properties, boat = p.kind === 'boat', uncertain = p.status === 'uncertain';
      L.geoJSON(f, {pane:'referenceRoutes', interactive:false, style:{color:'#fff',weight:7,opacity:.9}}).addTo(layer);
      const line = L.geoJSON(f, {pane:'referenceRoutes', style:{color:boat ? '#527b86' : uncertain ? '#ab6016' : '#514334',weight:3,opacity:1,dashArray:boat ? '7 7' : uncertain ? '4 5' : null,className:boat ? 'reference-route boat-route' : uncertain ? 'reference-route uncertain-route' : 'reference-route walking-route'}}).addTo(layer);
      const popup = document.createElement('div'); popup.className = 'route-popup';
      const heading = document.createElement('strong'); heading.textContent = p.name; popup.append(heading);
      for (const text of [p.note, `${p.provider} · 资料日期 ${p.sourceDate} · 核对 ${data.checkedAt}`]) {
        const paragraph = document.createElement('p'); paragraph.textContent = text; popup.append(paragraph);
      }
      const source = document.createElement('a'); source.href = p.sourceUrl; source.textContent = '查看路线来源'; source.target = '_blank'; source.rel = 'noopener'; popup.append(source);
      line.bindPopup(popup, popupOptions);
      const button = document.createElement('button'); button.type = 'button'; button.className = `route-row ${boat ? 'boat' : uncertain ? 'uncertain' : ''}`;
      button.textContent = p.name; button.dataset.route = p.id;
      button.onclick = () => {
        if (!toggle.checked) { toggle.checked = true; toggle.onchange(); }
        map.fitBounds(line.getBounds(), {padding:[45,75],maxZoom:15,animate:false});
        if (matchMedia('(max-width:760px)').matches) window.scrollTo(0,0);
        L.popup(popupOptions).setLatLng(line.getBounds().getCenter()).setContent(popup).openOn(map);
      };
      list.append(button);
    }
    attribution = '路线 © <a href="https://yamap.com/terms" target="_blank" rel="noopener">YAMAP</a> · <a href="https://www.shinguu.jp/kumanokodo2" target="_blank" rel="noopener">新宮市観光協会</a>';
    toggle.disabled = false; toggle.checked = true; toggle.onchange();
    status.textContent = data.coverageNote;
    return L.geoJSON(data).getBounds();
  } catch {
    layer.clearLayers(); list.replaceChildren(); toggle.checked = false; toggle.disabled = true;
    status.textContent = '路线暂未载入；盖章点与定位仍可使用。请刷新重试，或打开官方 PDF。';
  }
}
