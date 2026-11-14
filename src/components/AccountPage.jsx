import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CarFront, Check, Clock3, LogOut, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'

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
const progressSteps = ['confirmed', 'in_progress', 'quality_check', 'ready_for_pickup', 'completed']


function getFriendlyAuthError(error) {
  const message = String(error?.message || '').toLowerCase()
  if (message.includes('invalid login credentials')) return 'Nesprávný e-mail nebo heslo. Zkontrolujte přihlašovací údaje a zkuste to znovu.'
  if (message.includes('email not confirmed')) return 'Nejdříve potvrďte svou e-mailovou adresu pomocí odkazu v e-mailu.'
  if (message.includes('user already registered') || message.includes('already been registered')) return 'Účet s touto e-mailovou adresou už existuje. Přihlaste se nebo obnovte heslo.'
  if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('least'))) return 'Heslo nesplňuje bezpečnostní požadavky. Zvolte silnější heslo.'
  if (message.includes('invalid email') || message.includes('unable to validate email')) return 'Zadejte platnou e-mailovou adresu.'
  if (error?.status === 429 || message.includes('too many requests')) return 'Bylo provedeno příliš mnoho pokusů. Chvíli počkejte a zkuste to znovu.'
  if (message.includes('fetch') || message.includes('network')) return 'Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu.'
  return 'Přihlášení se nepodařilo. Zkontrolujte zadané údaje a zkuste to znovu.'
}

function localDate(value) {
  if (!value) return 'Termín zatím není stanoven'
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
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
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: '', registration: '' })
  const [bookingForm, setBookingForm] = useState({ vehicle: '', service: '', start: '', note: '' })
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

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
    if (profileError) setError(profileError.message)
    setProfile(profileData)

    const [{ data: vehicleData }, { data: serviceData }] = await Promise.all([
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('service_catalog').select('id, name, estimated_minutes, buffer_minutes').eq('active', true).order('sort_order'),
    ])
    setVehicles(vehicleData || [])
    setServices(serviceData || [])
    if (!bookingForm.vehicle && vehicleData?.[0]) setBookingForm(current => ({ ...current, vehicle: vehicleData[0].id }))
    if (!bookingForm.service && serviceData?.[0]) setBookingForm(current => ({ ...current, service: serviceData[0].id }))

    const staff = ['admin', 'employee'].includes(profileData?.role)
    let bookingQuery = supabase.from('bookings').select('*').order('start_at', { ascending: staff })
    if (!staff) bookingQuery = bookingQuery.eq('customer_id', userId)
    const { data: bookingData, error: bookingError } = await bookingQuery
    if (bookingError) setError(bookingError.message)
    setBookings(bookingData || [])

    const ids = (bookingData || []).map(item => item.id)
    if (ids.length) {
      const { data: updateData } = await supabase.from('job_updates').select('*').in('booking_id', ids).order('created_at', { ascending: false })
      setUpdates(updateData || [])
    } else setUpdates([])

    if (staff && bookingData?.length) {
      const customerIds = [...new Set(bookingData.map(item => item.customer_id))]
      const { data: people } = await supabase.from('profiles').select('id, full_name, phone').in('id', customerIds)
      setCustomers(Object.fromEntries((people || []).map(person => [person.id, person])))
    }
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
    if (result?.error) setError(getFriendlyAuthError(result.error))
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
    if (insertError) setError(insertError.message)
    else {
      setVehicleForm({ make: '', model: '', year: '', registration: '' })
      setShowVehicleForm(false)
      setMessage('Vozidlo bylo přidáno.')
      await loadDashboard()
    }
    setBusy(false)
  }

  async function requestBooking(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const { error: requestError } = await supabase.rpc('request_booking', {
      p_vehicle_id: bookingForm.vehicle,
      p_service_id: bookingForm.service,
      p_start_at: new Date(bookingForm.start).toISOString(),
      p_customer_note: bookingForm.note.trim() || null,
    })
    if (requestError) setError(requestError.message)
    else {
      setMessage('Žádost o termín byla odeslána. Počká na potvrzení.')
      setBookingForm(current => ({ ...current, start: '', note: '' }))
      await loadDashboard()
    }
    setBusy(false)
  }

  async function changeJobStatus(booking, status) {
    setBusy(true); setError('')
    const { error: updateError } = await supabase.from('bookings').update({ status }).eq('id', booking.id)
    if (!updateError) {
      await supabase.from('job_updates').insert({
        booking_id: booking.id,
        author_id: session.user.id,
        status,
        message: statusLabels[status],
        visible_to_customer: true,
      })
      await loadDashboard()
    } else setError(updateError.message)
    setBusy(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const staff = ['admin', 'employee'].includes(profile?.role)
  const newestUpdate = useMemo(() => {
    const map = {}
    updates.forEach(item => { if (!map[item.booking_id]) map[item.booking_id] = item })
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
          <section className="account-section">
            <div className="account-section-title"><div><span>AKTUÁLNÍ PŘEHLED</span><h2>Zakázky <b>{bookings.length}</b></h2></div></div>
            <div className="staff-booking-list">
              {bookings.map(booking => (
                <article className="staff-booking" key={booking.id}>
                  <div><span className="account-kicker">{statusLabels[booking.status] || booking.status}</span><h3>{vehicles.find(v => v.id === booking.vehicle_id)?.make || 'Vozidlo'} {vehicles.find(v => v.id === booking.vehicle_id)?.model || ''}</h3><p>{customers[booking.customer_id]?.full_name || 'Zákazník'} · {localDate(booking.start_at)}</p><small>Odhad dokončení: {localDate(booking.estimated_end_at)}</small></div>
                  <div className="staff-booking-controls">
                    <select value={booking.status} onChange={event => changeJobStatus(booking, event.target.value)} disabled={busy}>
                      {['pending','confirmed','in_progress','completed','cancelled'].map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                  </div>
                </article>
              ))}
              {!bookings.length && <p className="account-empty">Zatím zde nejsou žádné zakázky.</p>}
            </div>
          </section>
        ) : (
          <>
            <section className="account-section">
              <div className="account-section-title"><div><span>GARÁŽ</span><h2>Vaše vozidla</h2></div><button className="account-outline-button" onClick={() => setShowVehicleForm(!showVehicleForm)}><Plus size={15} /> Přidat vozidlo</button></div>
              {showVehicleForm && <form className="account-inline-form" onSubmit={addVehicle}>
                <input placeholder="Značka" value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm,make:e.target.value})} required />
                <input placeholder="Model" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm,model:e.target.value})} required />
                <input placeholder="Rok" type="number" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm,year:e.target.value})} />
                <input placeholder="SPZ (volitelné)" value={vehicleForm.registration} onChange={e => setVehicleForm({...vehicleForm,registration:e.target.value})} />
                <button className="account-submit" disabled={busy}>Uložit vozidlo <Check size={15} /></button>
              </form>}
              <div className="account-vehicle-grid">
                {vehicles.map(vehicle => <article className="account-vehicle" key={vehicle.id}><CarFront size={22} /><div><h3>{vehicle.make} {vehicle.model}</h3><p>{vehicle.year || 'Rok neuveden'} {vehicle.registration ? '· ' + vehicle.registration : ''}</p></div></article>)}
                {!vehicles.length && <p className="account-empty">Zatím nemáte přidané vozidlo.</p>}
              </div>
            </section>
            <section className="account-section">
              <div className="account-section-title"><div><span>REZERVACE</span><h2>Požádat o termín</h2></div></div>
              <form className="account-booking-form" onSubmit={requestBooking}>
                <label>Vozidlo<select value={bookingForm.vehicle} onChange={e => setBookingForm({...bookingForm,vehicle:e.target.value})} required><option value="">Vyberte vozidlo</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}</select></label>
                <label>Služba<select value={bookingForm.service} onChange={e => setBookingForm({...bookingForm,service:e.target.value})} required><option value="">Vyberte službu</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                <label>Datum a čas přistavení<input type="datetime-local" value={bookingForm.start} onChange={e => setBookingForm({...bookingForm,start:e.target.value})} min={new Date(Date.now()+3600000).toISOString().slice(0,16)} required /></label>
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
                  const currentStep = progressSteps.indexOf(update?.status || booking.status)
                  const completed = booking.status === 'completed'
                  return <article className="customer-booking" key={booking.id}>
                    <div className="customer-booking-head"><div><span className="account-kicker">{statusLabels[update?.status || booking.status] || booking.status}</span><h3>{vehicles.find(v => v.id === booking.vehicle_id)?.make} {vehicles.find(v => v.id === booking.vehicle_id)?.model}</h3><p>{localDate(booking.start_at)} · Předpokládané dokončení: {localDate(booking.estimated_end_at)}</p></div><span className="booking-status-dot" /></div>
                    <div className="booking-progress"><div className="booking-progress-fill" style={{width: completed ? '100%' : currentStep < 0 ? '8%' : ((currentStep + 1) / progressSteps.length * 100) + '%'}} /></div>
                    <div className="booking-progress-labels"><span>Přijato</span><span>V realizaci</span><span>Hotovo</span></div>
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
