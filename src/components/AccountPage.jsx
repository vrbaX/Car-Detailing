import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CarFront, Check, Clock3, LogOut, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import StaffDashboard from './StaffDashboard'

const statusLabels = {
  pending: 'Čeká na potvrzení',
  confirmed: 'Termín potvrzen',
  in_progress: 'Práce probíhá',
  quality_check: 'Závěrečná kontrola',
  ready_for_pickup: 'Připraveno k vyzvednutí',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
  rescheduled: 'Změna termínu',
}
const progressSteps = ['pending', 'confirmed', 'in_progress', 'quality_check', 'ready_for_pickup', 'completed']
const progressLabels = ['Přijato', 'Potvrzeno', 'V realizaci', 'Kontrola', 'Připraveno', 'Dokončeno']


function getFriendlyError(error, context = 'general') {
  const message = String(error?.message || '').toLowerCase()
  if (message.includes('invalid login credentials')) return 'Nesprávný e-mail nebo heslo. Zkontrolujte přihlašovací údaje a zkuste to znovu.'
  if (message.includes('email not confirmed')) return 'Nejdříve potvrďte svou e-mailovou adresu pomocí odkazu v e-mailu.'
  if (message.includes('user already registered') || message.includes('already been registered')) return 'Účet s touto e-mailovou adresou už existuje. Přihlaste se nebo obnovte heslo.'
  if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('least'))) return 'Heslo nesplňuje bezpečnostní požadavky. Zvolte silnější heslo.'
  if (message.includes('invalid email') || message.includes('unable to validate email')) return 'Zadejte platnou e-mailovou adresu.'
  if (error?.status === 429 || message.includes('too many requests')) return 'Bylo provedeno příliš mnoho pokusů. Chvíli počkejte a zkuste to znovu.'
  if (message.includes('this time is no longer available') || message.includes('selected time is not available')) return 'Tento termín už není volný. Vyberte prosím jiný.'
  if (message.includes('choose a future start time')) return 'Vyberte datum a čas v budoucnosti.'
  if (message.includes('cannot reschedule a job after work has started')) return 'Termín již nelze změnit, protože práce na zakázce začala.'
  if (message.includes('choose a future start time')) return 'Vyberte datum a čas v budoucnosti.'
  if (message.includes('service is unavailable')) return 'Vybraná služba už není dostupná. Obnovte stránku a vyberte jinou.'
  if (message.includes('vehicle not found')) return 'Vybrané vozidlo se nepodařilo najít. Obnovte stránku a zkuste to znovu.'
  if (error?.code === '23505') return 'Tento záznam už existuje.'
  if (error?.code === '23503') return 'Záznam nelze uložit, protože související údaje už nejsou dostupné.'
  if (error?.code === '42501' || message.includes('row-level security')) return 'K této akci nemáte oprávnění. Odhlaste se a znovu přihlaste; pokud problém přetrvá, kontaktujte správce.'
  if (message.includes('fetch') || message.includes('network')) return 'Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu.'
  if (context === 'vehicle') return 'Vozidlo se nepodařilo uložit. Zkontrolujte údaje a zkuste to znovu.'
  if (context === 'booking') return 'Žádost o termín se nepodařilo odeslat. Zkontrolujte údaje a zkuste to znovu.'
  if (context === 'profile') return 'Nepodařilo se načíst zákaznický profil. Obnovte stránku nebo se znovu přihlaste.'
  if (context === 'services') return 'Nepodařilo se načíst nabídku služeb. Obnovte stránku.'
  if (context === 'vehicles') return 'Nepodařilo se načíst vaše vozidla. Obnovte stránku.'
  return 'Něco se nepodařilo. Zkuste to prosím znovu.'
}

function localDate(value) {
  if (!value) return 'Termín zatím není stanoven'
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

async function fetchAllRows(buildQuery, pageSize = 500) {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)
    if (error) return { data: null, error }
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return { data: rows, error: null }
}

export default function AccountPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [updates, setUpdates] = useState([])
  const [customers, setCustomers] = useState({})
  const [team, setTeam] = useState([])
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', registration: '' })
  const [bookingForm, setBookingForm] = useState({ vehicle: '', service: '', start: '', note: '' })
  const [yearOptions] = useState(() => Array.from({ length: new Date().getFullYear() - 1885 }, (_, index) => String(new Date().getFullYear() + 1 - index)))
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  useEffect(() => {
    if (!message) return undefined
    const timeout = window.setTimeout(() => setMessage(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [message])

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      const callbackParams = new URLSearchParams(window.location.hash.slice(1))
      const callbackError = callbackParams.get('error_description')
      if (callbackError) {
        setError('Potvrzení e-mailu se nepodařilo dokončit. Otevřete nejnovější potvrzovací e-mail a zkuste odkaz znovu.')
      } else if (callbackParams.has('access_token') || callbackParams.get('type') === 'signup') {
        setMessage('E-mailová adresa byla potvrzena. Váš účet je připravený.')
      }
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      }
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user || !profile || loading) return undefined
    if (new URLSearchParams(window.location.search).get('rezervace') !== '1' || profile.role !== 'customer') return undefined
    const timer = window.setTimeout(() => document.getElementById('rezervace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    return () => window.clearTimeout(timer)
  }, [session, profile, loading])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setVehicles([])
      setBookings([])
      return
    }
    loadDashboard()
  }, [session])

  async function loadDashboard() {
    setLoading(true)
    setError('')
    const userId = session.user.id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles').select('id, full_name, phone, role').eq('id', userId).single()
    if (profileError) setError(getFriendlyError(profileError, 'profile'))
    setProfile(profileData)

    const [{ data: vehicleData, error: vehicleError }, { data: serviceData, error: serviceError }] = await Promise.all([
      fetchAllRows(() => supabase.from('vehicles').select('*').order('created_at', { ascending: false }).order('id', { ascending: true })),
      supabase.from('service_catalog').select('id, name, estimated_minutes, buffer_minutes').eq('active', true).order('sort_order'),
    ])
    if (vehicleError) setError(getFriendlyError(vehicleError, 'vehicles'))
    if (serviceError) setError(getFriendlyError(serviceError, 'services'))
    setVehicles(vehicleData || [])
    setServices(serviceData || [])
    if (!bookingForm.vehicle && vehicleData?.[0]) setBookingForm(current => ({ ...current, vehicle: vehicleData[0].id }))
    if (!bookingForm.service && serviceData?.[0]) setBookingForm(current => ({ ...current, service: serviceData[0].id }))

    const staff = ['admin', 'employee'].includes(profileData?.role)
    const { data: bookingData, error: bookingError } = await fetchAllRows(() => {
      let query = supabase.from('bookings').select('*').order('start_at', { ascending: staff }).order('id', { ascending: true })
      if (!staff) query = query.eq('customer_id', userId)
      return query
    })
    if (bookingError) setError(getFriendlyError(bookingError, 'booking'))
    setBookings(bookingData || [])

    const ids = (bookingData || []).map(item => item.id)
    if (ids.length) {
      const { data: updateData } = await supabase.from('job_updates').select('*').in('booking_id', ids).order('created_at', { ascending: false })
      setUpdates(updateData || [])
    } else setUpdates([])

    if (staff) {
      const { data: people, error: peopleError } = await fetchAllRows(() => supabase.from('profiles').select('id, full_name, phone, email, role, created_at').order('created_at', { ascending: false }).order('id', { ascending: true }))
      if (peopleError) setError(getFriendlyError(peopleError, 'profile'))
      setTeam(people || [])
      setCustomers(Object.fromEntries((people || []).map(person => [person.id, person])))
    } else { setTeam([]); setCustomers({}) }
    setLoading(false)
  }

  async function handleAuth(event) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    let result
    if (mode === 'register') {
      result = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: String(form.get('full_name') || '').trim() },
          emailRedirectTo: window.location.origin + '/ucet',
        },
      })
      if (!result.error) setMessage('Registrace proběhla. Pokud je vyžadováno ověření e-mailu, potvrďte jej přes odkaz v doručené zprávě.')
    } else if (mode === 'reset') {
      result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/ucet' })
      if (!result.error) setMessage('Pokud účet s touto adresou existuje, pošleme odkaz pro změnu hesla.')
    } else {
      result = await supabase.auth.signInWithPassword({ email, password })
    }
    if (result?.error) setError(getFriendlyError(result.error, 'auth'))
    setBusy(false)
  }

  async function addVehicle(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const { error: insertError } = await supabase.from('vehicles').insert({
      owner_id: session.user.id,
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      year: vehicleForm.year ? Number(vehicleForm.year) : null,
      registration: vehicleForm.registration.trim() || null,
    })
    if (insertError) setError(getFriendlyError(insertError, 'vehicle'))
    else {
      setVehicleForm({ make: '', model: '', year: '', registration: '' })
      setShowVehicleForm(false)
      setMessage('Vozidlo bylo přidáno.')
      await loadDashboard()
    }
    setBusy(false)
  }

  async function requestBooking(event) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    const selectedDate = bookingForm.start.slice(0, 10)
    const selectedTime = bookingForm.start.slice(11, 16)
    const localStart = new Date(`${selectedDate}T${selectedTime}`)
    if (!selectedDate || !selectedTime || Number.isNaN(localStart.getTime())) {
      setError('Vyberte datum i čas přistavení vozidla.')
      setBusy(false)
      return
    }
    const { error: requestError } = await supabase.rpc('request_booking', {
      p_vehicle_id: bookingForm.vehicle,
      p_service_id: bookingForm.service,
      p_start_at: localStart.toISOString(),
      p_customer_note: bookingForm.note.trim() || null,
    })
    if (requestError) setError(getFriendlyError(requestError, 'booking'))
    else {
      setMessage('Žádost o termín byla odeslána. Počká na potvrzení.')
      setBookingForm(current => ({ ...current, start: '', note: '' }))
      await loadDashboard()
    }
    setBusy(false)
  }

  async function changeJobStatus(booking, status) {
    setBusy(true); setError('')
    const { error: updateError } = await supabase.rpc('staff_update_booking_status', {
      p_booking_id: booking.id, p_status: status, p_message: statusLabels[status],
    })
    if (updateError) setError(getFriendlyError(updateError, 'booking'))
    else await loadDashboard()
    setBusy(false)
  }

  async function claimJob(bookingId) {
    setBusy(true); setError(''); setMessage('')
    const { error: claimError } = await supabase.rpc('claim_booking', { p_booking_id: bookingId })
    if (claimError) setError(getFriendlyError(claimError, 'booking'))
    else { setMessage('Zakázka byla přiřazena k vašemu účtu.'); await loadDashboard() }
    setBusy(false)
  }

  async function assignJob(bookingId, employeeId) {
    setBusy(true); setError('')
    const { error: assignError } = await supabase.rpc('admin_assign_booking', { p_booking_id: bookingId, p_employee_id: employeeId || null })
    if (assignError) setError(getFriendlyError(assignError, 'booking'))
    else { setMessage(employeeId ? 'Zakázka byla potvrzena a přiřazena zaměstnanci.' : 'Zakázka byla uvolněna do nabídky.'); await loadDashboard() }
    setBusy(false)
  }

  async function rescheduleJob(bookingId, date, time) {
    setBusy(true); setError(''); setMessage('')
    const localStart = new Date(`${date}T${time}`)
    if (!date || !time || Number.isNaN(localStart.getTime()) || localStart <= new Date()) {
      setError('Vyberte budoucí datum a čas.')
      setBusy(false)
      return
    }
    const { error: rescheduleError } = await supabase.rpc('admin_reschedule_booking', {
      p_booking_id: bookingId,
      p_new_start_at: localStart.toISOString(),
    })
    if (rescheduleError) setError(getFriendlyError(rescheduleError, 'booking'))
    else { setMessage('Termín zakázky byl změněn. Průběh práce zůstal zachován.'); await loadDashboard() }
    setBusy(false)
  }

  async function setUserRole(userId, role) {
    setBusy(true); setError('')
    const { error: roleError } = await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role })
    if (roleError) setError(getFriendlyError(roleError, 'profile'))
    else { setMessage(role === 'employee' ? 'Uživatel byl přidán do týmu.' : 'Role uživatele byla změněna.'); await loadDashboard() }
    setBusy(false)
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: 'local' })
    window.location.href = '/'
  }

  const staff = ['admin', 'employee'].includes(profile?.role)
  const newestUpdate = useMemo(() => {
    const map = {}
    updates.forEach(item => { if (!map[item.booking_id]) map[item.booking_id] = item })
    return map
  }, [updates])
  const latestProgressStatus = useMemo(() => {
    const map = {}
    updates.forEach(item => {
      if (!map[item.booking_id] && progressSteps.includes(item.status)) map[item.booking_id] = item.status
    })
    return map
  }, [updates])

  if (!supabaseConfigured) return (
    <main className="account-shell">
      <a className="account-back" href="/"><ArrowLeft size={16} /> Zpět na web</a>
      <section className="account-card">
        <span className="account-mark">VRB<span>.</span></span>
        <h1>Přístup k účtu není nastaven</h1>
        <p>Chybí připojení k databázi. Přihlašování se aktivuje po nastavení proměnných projektu.</p>
      </section>
    </main>
  )

  if (loading && !session) return <main className="account-shell"><div className="account-loading">Načítání účtu…</div></main>

  if (!session) return (
    <main className="account-shell">
      <a className="account-back" href="/"><ArrowLeft size={16} /> Zpět na web</a>
      <div className="account-auth-layout">
        <section className="account-intro">
          <span className="account-kicker"><i /> ZÁKAZNICKÁ ZÓNA</span>
          <span className="account-mark">VRB<span>.</span></span>
          <h1>Péče o vůz.<br /><em>Pod kontrolou.</em></h1>
          <p>Na jednom místě najdete termíny, informace o svém voze a průběh práce.</p>
          <div className="account-feature"><ShieldCheck size={18} /> Soukromý přístup k vašim zakázkám</div>
          <div className="account-feature"><Clock3 size={18} /> Aktuální stav a předpokládané dokončení</div>
        </section>
        <section className="account-card">
          <div className="account-card-heading">
            <span>{mode === 'register' ? 'NOVÝ ÚČET' : mode === 'reset' ? 'OBNOVA PŘÍSTUPU' : 'VÍTEJTE ZPĚT'}</span>
            <h2>{mode === 'register' ? 'Vytvořit účet' : mode === 'reset' ? 'Obnovit heslo' : 'Přihlášení'}</h2>
            <p>{mode === 'register' ? 'Registrace je otevřená všem zákazníkům.' : mode === 'reset' ? 'Pošleme vám odkaz pro nastavení nového hesla.' : 'Přihlaste se ke svému zákaznickému účtu.'}</p>
          </div>
          <form className="account-form" onSubmit={handleAuth}>
            {mode === 'register' && <label>Jméno a příjmení<input name="full_name" autoComplete="name" placeholder="Vaše jméno" required /></label>}
            <label>E-mail<input type="email" name="email" autoComplete="email" placeholder="vas@email.cz" required /></label>
            {mode !== 'reset' && <label>Heslo<input type="password" name="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Minimálně 8 znaků" minLength={8} required /></label>}
            {mode === 'login' && <button className="account-text-button" type="button" onClick={() => { setMode('reset'); setError(''); setMessage('') }}>Zapomenuté heslo?</button>}
            {error && <p className="account-alert account-error">{error}</p>}
            {message && <p className="account-alert account-success">{message}</p>}
            <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Chvíli strpení…' : mode === 'register' ? 'Vytvořit účet' : mode === 'reset' ? 'Odeslat odkaz' : 'Přihlásit se'} <ArrowUpRight size={16} /></button>
          </form>
          <div className="account-switch">
            {mode === 'login' && <>Ještě nemáte účet? <button onClick={() => { setMode('register'); setError(''); setMessage('') }}>Zaregistrovat se</button></>}
            {mode === 'register' && <>Už účet máte? <button onClick={() => { setMode('login'); setError(''); setMessage('') }}>Přihlásit se</button></>}
            {mode === 'reset' && <button onClick={() => { setMode('login'); setError(''); setMessage('') }}>Zpět na přihlášení</button>}
          </div>
          <p className="account-legal">Pokračováním souhlasíte se zpracováním údajů nezbytných pro vedení zákaznického účtu.</p>
        </section>
      </div>
    </main>
  )

  return (
    <main className="account-dashboard">
      <header className="account-topbar">
        <a href="/" className="account-brand">VRB<span>.</span><small>DETAILING</small></a>
        <div className="account-top-actions">
          <span><UserRound size={15} /> {profile?.full_name || session.user.email}</span>
          <button onClick={signOut}><LogOut size={15} /> Odhlásit</button>
        </div>
      </header>
      <div className="account-content">
        <div className="account-welcome">
          <div><span className="account-kicker"><i /> {staff ? 'SPRÁVA PROVOZU' : 'ZÁKAZNICKÝ ÚČET'}</span><h1>{staff ? 'Přehled zakázek.' : <>Váš vůz.<br /><em>Aktuální stav.</em></>}</h1></div>
          <p>{staff ? 'Přehled přijatých žádostí a aktuální práce.' : 'Termíny, vozidla a průběh detailingu na jednom místě.'}</p>
        </div>
        {error && <p className="account-alert account-error">{error}</p>}
        {message && <p className="account-alert account-success">{message}</p>}
        {loading ? <div className="account-loading">Načítání přehledu…</div> : staff ? (
          <StaffDashboard profile={profile} bookings={bookings} vehicles={vehicles} services={services}
            customers={customers} team={team} busy={busy} onStatusChange={changeJobStatus}
            onClaim={claimJob} onAssign={assignJob} onReschedule={rescheduleJob} onRoleChange={setUserRole} />
        ) : (
          <>
            <section className="account-section">
              <div className="account-section-title"><div><span>GARÁŽ</span><h2>Vaše vozidla</h2></div><button className="account-outline-button" onClick={() => setShowVehicleForm(!showVehicleForm)}><Plus size={15} /> Přidat vozidlo</button></div>
              {showVehicleForm && <form className="account-inline-form" onSubmit={addVehicle}>
                <input placeholder="Značka" value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm,make:e.target.value})} required />
                <input placeholder="Model" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm,model:e.target.value})} required />
                <select aria-label="Rok výroby" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm,year:e.target.value})}><option value="">Rok výroby</option>{yearOptions.map(year => <option key={year} value={year}>{year}</option>)}</select>
                <input placeholder="SPZ (volitelné)" value={vehicleForm.registration} onChange={e => setVehicleForm({...vehicleForm,registration:e.target.value})} />
                <button className="account-submit" disabled={busy}>Uložit vozidlo <Check size={15} /></button>
              </form>}
              <div className="account-vehicle-grid">
                {vehicles.map(vehicle => <article className="account-vehicle" key={vehicle.id}><CarFront size={22} /><div><h3>{vehicle.make} {vehicle.model}</h3><p>{vehicle.year || 'Rok neuveden'} {vehicle.registration ? '· ' + vehicle.registration : ''}</p></div></article>)}
                {!vehicles.length && <p className="account-empty">Zatím nemáte přidané vozidlo.</p>}
              </div>
            </section>
            <section className="account-section" id="rezervace">
              <div className="account-section-title"><div><span>REZERVACE</span><h2>Požádat o termín</h2></div></div>
              <form className="account-booking-form" onSubmit={requestBooking}>
                <label>Vozidlo<select value={bookingForm.vehicle} onChange={e => setBookingForm({...bookingForm,vehicle:e.target.value})} required><option value="">Vyberte vozidlo</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}</select></label>
                <label>Služba<select value={bookingForm.service} onChange={e => setBookingForm({...bookingForm,service:e.target.value})} required><option value="">Vyberte službu</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} · {Math.round(s.estimated_minutes / 60 * 10) / 10} h práce</option>)}</select></label>
                <label>Datum přistavení<input type="date" value={bookingForm.start.slice(0,10)} onChange={e => setBookingForm(current => ({...current,start:e.target.value ? `${e.target.value}T${current.start.slice(11,16) || '09:00'}` : ''}))} min={new Date().toLocaleDateString('en-CA')} required /></label>
                <label>Čas přistavení<input type="time" value={bookingForm.start.slice(11,16)} min={bookingForm.start.slice(0,10) === new Date().toLocaleDateString('en-CA') ? new Date().toTimeString().slice(0,5) : undefined} onChange={e => setBookingForm(current => ({...current,start:current.start.slice(0,10) ? `${current.start.slice(0,10)}T${e.target.value}` : current.start}))} required /></label>
                <label>Poznámka<textarea rows="2" placeholder="Doplňující informace k vozu nebo službě" value={bookingForm.note} onChange={e => setBookingForm({...bookingForm,note:e.target.value})} /></label>
                <button className="account-submit" disabled={busy || !vehicles.length || !services.length}>Odeslat žádost <ArrowUpRight size={16} /></button>
                {!services.length && <p className="account-hint">Služby zatím nejsou v systému nastavené.</p>}
              </form>
            </section>
            <section className="account-section">
              <div className="account-section-title"><div><span>HISTORIE A PRŮBĚH</span><h2>Vaše zakázky</h2></div></div>
              <div className="customer-booking-list">
                {bookings.map(booking => {
                  const update = newestUpdate[booking.id]
                  const currentStatus = booking.status === 'rescheduled'
                    ? (latestProgressStatus[booking.id] || 'confirmed')
                    : booking.status
                  const currentStep = progressSteps.indexOf(currentStatus)
                  const completed = currentStatus === 'completed'
                  const progressPercent = completed ? 100 : Math.max(0, currentStep) / (progressSteps.length - 1) * 100
                  return <article className="customer-booking" key={booking.id}>
                    <div className="customer-booking-head"><div><span className="account-kicker">{statusLabels[booking.status] || booking.status}</span><h3>{vehicles.find(v => v.id === booking.vehicle_id)?.make} {vehicles.find(v => v.id === booking.vehicle_id)?.model}</h3><p>{localDate(booking.start_at)} · Předpokládané dokončení: {localDate(booking.estimated_end_at)}</p></div><span className={`booking-status-dot ${booking.status === 'cancelled' ? 'is-cancelled' : completed ? 'is-complete' : ''}`} /></div>
                    {booking.status === 'cancelled' ? (
                      <div className="booking-exception">Tato zakázka byla zrušena. Pokud chcete domluvit nový termín, kontaktujte nás.</div>
                    ) : (
                      <>
                        {booking.status === 'rescheduled' && <div className="booking-exception">U zakázky se mění termín. Aktuální průběh níže vychází z posledního potvrzeného kroku.</div>}
                        <div className="booking-progress-visual">
                          <div className="booking-progress" role="progressbar" aria-label="Průběh zakázky" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progressPercent)}>
                            <div className="booking-progress-fill" style={{width: progressPercent + '%'}} />
                          </div>
                          <div className="booking-progress-steps">
                            {progressSteps.map((step, index) => (
                              <div className={`booking-progress-step ${index < currentStep ? 'is-done' : ''} ${index === currentStep ? 'is-current' : ''}`} key={step}>
                                <span className="booking-progress-node">{index + 1}</span>
                                <span className="booking-progress-label">{progressLabels[index]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {update?.message && <p className="booking-update">{update.message}</p>}
                  </article>
                })}
                {!bookings.length && <p className="account-empty">Zatím nemáte žádné zakázky. O termín můžete požádat výše.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
