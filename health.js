export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function weightSeries(events,petId){
 return events.filter(e=>e.pet_id===petId&&e.weight_kg!==null&&e.weight_kg!==''&&Number.isFinite(Number(e.weight_kg))&&Number(e.weight_kg)>0&&/^\d{4}-\d{2}-\d{2}$/.test(e.event_date)&&Number.isFinite(Date.parse(e.event_date)))
 .map(e=>({...e,weight:Number(e.weight_kg),time:Date.parse(e.event_date)}))
 .sort((a,b)=>a.time-b.time||String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.id).localeCompare(String(b.id)));
}
export const kg=value=>new Intl.NumberFormat('ca-ES',{maximumFractionDigits:3}).format(value)+' kg';
export function weightChart(series){
 if(!series.length)return '<p class="empty">Encara no hi ha pesatges. Afegeix el primer per començar la gràfica.</p>';
 const left=64,right=688,top=26,bottom=224;
 const values=series.map(e=>e.weight),low=Math.min(...values),high=Math.max(...values);
 const pad=Math.max((high-low)*.2,high*.025,.1),min=Math.max(0,low-pad),max=high+pad;
 const first=series[0].time,last=series.at(-1).time;
 const x=e=>first===last?(left+right)/2:left+(e.time-first)/(last-first)*(right-left);
 const y=e=>bottom-(e.weight-min)/(max-min)*(bottom-top);
 const date=d=>new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(d));
 const ticks=Array.from({length:5},(_,i)=>{const v=min+(max-min)*i/4,py=bottom-i*(bottom-top)/4;return `<line x1="${left}" x2="${right}" y1="${py}" y2="${py}" stroke="#e4e9e2"/><text x="54" y="${py+4}" text-anchor="end">${new Intl.NumberFormat('ca-ES',{maximumFractionDigits:2}).format(v)}</text>`;}).join('');
 return `<div class="weight-chart"><svg viewBox="0 0 720 280" role="img" aria-labelledby="weight-chart-title weight-chart-desc"><title id="weight-chart-title">Evolució del pes en quilograms</title><desc id="weight-chart-desc">${series.length} pesatges ordenats per data. Els valors exactes es mostren a la llista de sota. L’eix vertical s’ajusta a les mesures.</desc><g class="chart-labels">${ticks}<text x="${left}" y="16">kg</text><text x="${left}" y="258">${escapeHTML(date(first))}</text>${first!==last?`<text x="${right}" y="258" text-anchor="end">${escapeHTML(date(last))}</text>`:''}</g>${series.length>1?`<polyline points="${series.map(e=>`${x(e)},${y(e)}`).join(' ')}" fill="none" stroke="#246c59" stroke-width="3" stroke-linejoin="round"/>`:''}${series.map(e=>`<circle cx="${x(e)}" cy="${y(e)}" r="5" fill="#246c59" stroke="white" stroke-width="2"><title>${escapeHTML(date(e.time)+' · '+kg(e.weight))}</title></circle>`).join('')}</svg></div><p class="note">${series.length===1?'Amb un segon pesatge podràs veure la línia d’evolució.':'Cada punt és un pesatge; la distància entre punts representa el temps transcorregut.'} L’eix vertical s’ajusta als pesos registrats.</p>`;
}
