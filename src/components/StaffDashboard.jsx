import { useMemo, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, CarFront, Check, Search, ShieldCheck, UserRound, Users, X } from 'lucide-react'
const labels={pending:'Čeká na potvrzení',confirmed:'Termín potvrzen',in_progress:'Práce probíhá',quality_check:'Závěrečná kontrola',ready_for_pickup:'Připraveno k vyzvednutí',completed:'Dokončeno',cancelled:'Zrušeno',rescheduled:'Změna termínu'}
const statuses=['pending','confirmed','in_progress','quality_check','ready_for_pickup','completed','cancelled','rescheduled']
const employeeStatuses=['in_progress','quality_check','ready_for_pickup','completed']
const date=value=>value?new Intl.DateTimeFormat('cs-CZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Není stanoveno'

function JobCard({booking,vehicle,customer,service,employee,employees,admin,busy,onStatusChange,onClaim,onAssign}){
 const canClaim=!admin&&booking.status==='confirmed'&&!booking.assigned_employee_id
 return <article className="staff-booking staff-job-card">
  <div className="staff-booking-main">
   <div className="staff-booking-heading"><span className={`staff-status status-${booking.status}`}>{labels[booking.status]||booking.status}</span><span className="staff-booking-id">#{booking.id.slice(0,8).toUpperCase()}</span></div>
   <h3>{vehicle?`${vehicle.make} ${vehicle.model}`:'Vozidlo'}</h3>
   <div className="staff-booking-meta"><span><UserRound size={14}/>{customer?.full_name||'Zákazník'}</span>{customer?.phone&&<span>{customer.phone}</span>}<span><CarFront size={14}/>{service?.name||'Služba'}</span></div>
   <div className="staff-booking-times"><span><CalendarDays size={14}/> Přistavení <b>{date(booking.start_at)}</b></span><span><Check size={14}/> Odhad dokončení <b>{date(booking.estimated_end_at)}</b></span></div>
   <p className="staff-assignment-line"><UserRound size={14}/>{employee?`Přiřazeno: ${employee.full_name||'Člen týmu'}`:'Zatím nepřiřazeno'}</p>
  </div>
  <div className="staff-booking-controls">
   {admin?<><label>Přiřazený zaměstnanec<select value={booking.assigned_employee_id||''} onChange={e=>onAssign(booking.id,e.target.value)} disabled={busy}>{['pending','confirmed'].includes(booking.status)&&<option value="">Volná zakázka</option>}{employees.map(person=><option key={person.id} value={person.id}>{person.full_name||'Zaměstnanec'}</option>)}</select></label>
   <label>Stav zakázky<select value={booking.status} onChange={e=>onStatusChange(booking,e.target.value)} disabled={busy}>{statuses.map(status=><option key={status} value={status}>{labels[status]}</option>)}</select></label></>
   :canClaim?<button className="account-submit staff-claim-button" type="button" onClick={()=>onClaim(booking.id)} disabled={busy}>Převzít zakázku <ArrowUpRight size={15}/></button>
   :booking.assigned_employee_id?<label>Stav mé zakázky<select value={booking.status} onChange={e=>onStatusChange(booking,e.target.value)} disabled={busy||booking.status==='pending'}>{[booking.status,...employeeStatuses.filter(status=>status!==booking.status)].map(status=><option key={status} value={status}>{labels[status]}</option>)}</select></label>
   :<span className="staff-job-locked">Čeká na potvrzení administrátorem</span>}
  </div>
 </article>
}

export default function StaffDashboard({profile,bookings,vehicles,services,customers,team,busy,onStatusChange,onClaim,onAssign,onRoleChange}){
 const admin=profile?.role==='admin'
 const [searchTerm,setSearchTerm]=useState('')
 const employees=useMemo(()=>team.filter(p=>p.role==='employee'),[team])
 const available=useMemo(()=>bookings.filter(b=>b.status==='confirmed'&&!b.assigned_employee_id),[bookings])
 const mine=useMemo(()=>bookings.filter(b=>b.assigned_employee_id===profile?.id),[bookings,profile?.id])
 const active=useMemo(()=>bookings.filter(b=>!['completed','cancelled'].includes(b.status)),[bookings])
 const normalizedSearch=searchTerm.trim().toLocaleLowerCase('cs-CZ')
 const matches=(...values)=>!normalizedSearch||values.filter(Boolean).join(' ').toLocaleLowerCase('cs-CZ').includes(normalizedSearch)
 const filteredTeam=useMemo(()=>team.filter(person=>matches(person.full_name,person.email,person.phone,person.role,person.id)),[team,normalizedSearch])
 const filteredBookings=useMemo(()=>bookings.filter(booking=>{
  const vehicle=vehicles.find(item=>item.id===booking.vehicle_id)
  const customer=customers[booking.customer_id]
  const service=services.find(item=>item.id===booking.service_id)
  const employee=team.find(item=>item.id===booking.assigned_employee_id)
  return matches(booking.id,booking.id.slice(0,8),vehicle?.make,vehicle?.model,vehicle?.registration,customer?.full_name,customer?.email,customer?.phone,service?.name,employee?.full_name,booking.status)
 }),[bookings,vehicles,customers,services,team,normalizedSearch])
 const visibleTeam=normalizedSearch?filteredTeam:team.filter(person=>person.role!=='admin')
 const getEmployee=id=>team.find(p=>p.id===id)
 const job=b=><JobCard key={b.id} booking={b} vehicle={vehicles.find(v=>v.id===b.vehicle_id)} customer={customers[b.customer_id]} service={services.find(s=>s.id===b.service_id)} employee={getEmployee(b.assigned_employee_id)} employees={employees} admin={admin} busy={busy} onStatusChange={onStatusChange} onClaim={onClaim} onAssign={onAssign}/>
 return <>
  <section className="account-section"><div className="account-section-title"><div><span>{admin?'ADMINISTRACE':'PRACOVNÍ PŘEHLED'}</span><h2>{admin?'Provozní centrum':'Moje práce'}</h2></div></div>
   <div className="staff-metrics-grid"><article><span>Čeká na potvrzení</span><strong>{bookings.filter(b=>b.status==='pending').length}</strong></article><article><span>Volné zakázky</span><strong>{available.length}</strong></article><article><span>Rozpracované</span><strong>{bookings.filter(b=>['in_progress','quality_check','ready_for_pickup'].includes(b.status)).length}</strong></article><article><span>Dokončené</span><strong>{bookings.filter(b=>b.status==='completed').length}</strong></article></div>
  </section>
  {admin&&<section className="account-section staff-search-section"><div className="staff-search-control"><Search size={18}/><input type="search" value={searchTerm} onChange={event=>setSearchTerm(event.target.value)} placeholder="Hledat účet nebo zakázku: jméno, e-mail, telefon, vozidlo, SPZ, ID…" aria-label="Hledat v účtech a zakázkách" />{searchTerm&&<button type="button" onClick={()=>setSearchTerm('')} aria-label="Vymazat hledání"><X size={16}/></button>}</div><p className="staff-search-summary">{normalizedSearch?<>Nalezeno <b>{filteredTeam.length}</b> účtů a <b>{filteredBookings.length}</b> zakázek</>:'Vyhledávání prochází zákaznické účty i zakázky včetně vozidel a přiřazených zaměstnanců.'}</p></section>}
  {admin&&<section className="account-section"><div className="account-section-title"><div><span>SPRÁVA LIDÍ</span><h2>Tým a oprávnění <b>{employees.length}</b></h2></div><Users size={20}/></div>
   <p className="staff-section-description">Zákazníky můžete přidat do týmu. Administrátorská oprávnění se zde nepřidělují. Zaměstnance s aktivními zakázkami nelze odebrat, dokud jejich práci nepřeřadíte.</p>
   <div className="staff-team-list">{visibleTeam.map(person=><article className="staff-team-row" key={person.id}><div className="staff-team-person"><span className="staff-team-avatar"><UserRound size={16}/></span><div><strong>{person.full_name||'Bez uvedeného jména'}</strong><small>{person.email||'E-mail neuveden'} · {person.phone||'Telefon neuveden'} · {person.role==='employee'?'Zaměstnanec':'Zákazník'}</small></div></div>{person.role!=='admin'?<label className="staff-role-control"><span>Role</span><select value={person.role} onChange={e=>onRoleChange(person.id,e.target.value)} disabled={busy}><option value="customer">Zákazník</option><option value="employee">Zaměstnanec</option></select></label>:<span className="staff-admin-label">Administrátor</span>}</article>)}{!visibleTeam.length&&<p className="account-empty">{normalizedSearch?'Žádný účet neodpovídá hledání.':'Zatím zde nejsou další zákaznické účty.'}</p>}</div>
  </section>}
  {admin?<><section className="account-section"><div className="account-section-title"><div><span>ROZHODNUTÍ ADMINISTRÁTORA</span><h2>Nové žádosti <b>{bookings.filter(b=>b.status==='pending').length}</b></h2></div><ShieldCheck size={20}/></div><p className="staff-section-description">Potvrďte termín, nebo žádost zrušte. Potvrzené zakázky se automaticky objeví zaměstnancům v nabídce volné práce.</p><div className="staff-booking-list">{filteredBookings.filter(b=>b.status==='pending').map(job)}{!filteredBookings.some(b=>b.status==='pending')&&<p className="account-empty">{normalizedSearch?'Žádná odpovídající nová žádost.':'Žádné nové žádosti k vyřízení.'}</p>}</div></section>
   <section className="account-section"><div className="account-section-title"><div><span>ROZDĚLENÍ PRÁCE</span><h2>Všechny zakázky <b>{active.length}</b></h2></div><BriefcaseBusiness size={20}/></div><p className="staff-section-description">Přiřazení lze změnit kdykoliv. Odebráním zaměstnance se potvrzená zakázka vrátí do nabídky ostatních.</p><div className="staff-booking-list">{filteredBookings.filter(b=>!['pending','completed','cancelled'].includes(b.status)).map(job)}{!filteredBookings.some(b=>!['pending','completed','cancelled'].includes(b.status))&&<p className="account-empty">{normalizedSearch?'Žádná odpovídající aktivní zakázka.':'Zatím nejsou žádné potvrzené ani aktivní zakázky.'}</p>}</div></section></>
  :<><section className="account-section"><div className="account-section-title"><div><span>VOLNÁ PRÁCE</span><h2>Dostupné zakázky <b>{available.length}</b></h2></div><BriefcaseBusiness size={20}/></div><p className="staff-section-description">Vyberte si potvrzenou zakázku. Jakmile ji převezmete, zmizí z nabídky ostatních zaměstnanců.</p><div className="staff-booking-list">{available.map(job)}{!available.length&&<p className="account-empty">Momentálně nejsou k dispozici žádné volné zakázky.</p>}</div></section>
   <section className="account-section"><div className="account-section-title"><div><span>PŘIŘAZENO MNĚ</span><h2>Moje zakázky <b>{mine.length}</b></h2></div><BriefcaseBusiness size={20}/></div><div className="staff-booking-list">{mine.map(job)}{!mine.length&&<p className="account-empty">Zatím nemáte převzatou žádnou zakázku.</p>}</div></section></>}
 </>
}
