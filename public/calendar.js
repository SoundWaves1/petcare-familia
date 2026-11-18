// Dates i hores civils d'Europe/Madrid: no es converteixen amb UTC.
export const canisExample=Object.freeze({appointment_date:'2026-11-23',appointment_time:'10:30',pet_id:null,center_name:'Hospital Veterinari Canis',reason:'Visita veterinària',status:'programada',notes:''});
export const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const civilDate=s=>new Date(s+'T12:00:00');
export function period(anchor,view){
 const d=civilDate(anchor);
 if(view==='week')d.setDate(d.getDate()-(d.getDay()+6)%7);else d.setDate(1);
 const first=new Date(d);
 if(view==='week')d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1);
 return {start:dayKey(first),end:dayKey(d)};
}
export function calendarDays(anchor,view){
 const {start}=period(anchor,view),d=civilDate(start);
 if(view==='month')d.setDate(d.getDate()-(d.getDay()+6)%7);
 return Array.from({length:view==='week'?7:42},()=>{const key=dayKey(d);d.setDate(d.getDate()+1);return key;});
}
export function moveAnchor(anchor,view,step){const d=civilDate(anchor);if(view==='week')d.setDate(d.getDate()+step*7);else{d.setDate(1);d.setMonth(d.getMonth()+step);}return dayKey(d);}
export function inPeriod(items,anchor,view){const {start,end}=period(anchor,view);return items.filter(a=>a.appointment_date>=start&&a.appointment_date<end).sort((a,b)=>(a.appointment_date+a.appointment_time).localeCompare(b.appointment_date+b.appointment_time));}
