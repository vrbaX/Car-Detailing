import { useEffect, useState } from 'react'
import {
  ArrowUpRight, ChevronDown, Check,
  CircleDot, Clock3, Droplets, Gauge, ShieldCheck, Sparkles,
} from 'lucide-react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AccountPage from './components/AccountPage'

const services = [
  {
    number: '01',
    icon: Droplets,
    title: 'Čištění interiéru',
    description: 'Hloubkové vyčištění čalounění, koberců, plastů i hůře dostupných míst. Rozsah volíme podle materiálů a míry znečištění.',
    tags: ['Textil a kůže', 'Plasty', 'Detaily'],
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Péče o exteriér',
    description: 'Bezpečné mytí a dekontaminace povrchu. Cílem je čistý vůz bez zbytečného namáhání laku.',
    tags: ['Ruční mytí', 'Dekontaminace', 'Kola'],
  },
  {
    number: '03',
    icon: Gauge,
    title: 'Korekce laku',
    description: 'Leštění zaměřené na odstranění vybraných defektů a sjednocení vzhledu laku. Postup určuje jeho skutečný stav.',
    tags: ['Leštění', 'Defekty laku', 'Lesk'],
  },
  {
    number: '04',
    icon: ShieldCheck,
    title: 'Ochrana laku',
    description: 'Ochranné přípravky a keramické povlaky pro snazší údržbu a dlouhodobější ochranu povrchu.',
    tags: ['Keramická ochrana', 'Vosk', 'Údržba'],
  },
]

const faqs = [
  ['Jak dlouho trvá detailing?', 'Doba práce se liší podle zvolené služby, velikosti vozu a jeho stavu. Přesný čas proto nelze určit obecně. Odhad vám sdělíme po domluvě o rozsahu práce, ještě před předáním vozu.'],
  ['Je nutné objednat se předem?', 'Ano. Pracujeme na předem domluvené termíny, abychom měli na každý vůz dostatek času. Nejprve nám popište, co potřebujete, a společně domluvíme další postup.'],
  ['Lze odstranit všechny škrábance?', 'Ne. Leštěním lze upravit především škrábance a vady v čiré vrstvě laku. Pokud poškození zasahuje hlouběji, samotné leštění ho neodstraní. Možnosti korekce vždy závisí na stavu laku.'],
  ['Kdy se dozvím konečnou cenu?', 'Cenu stanovíme podle velikosti a stavu vozu a podle rozsahu požadované práce. Konkrétní částku vám sdělíme před zahájením; bez vašeho souhlasu žádné práce nezačneme.'],
]


const calculatorServices = [
  { id: 'interior', name: 'Hloubkové čištění interiéru', base: 2500 },
  { id: 'exterior', name: 'Mytí a dekontaminace laku', base: 1500 },
  { id: 'correction', name: 'Jednokrokové leštění laku', base: 5000 },
  { id: 'protection', name: 'Keramická ochrana laku', base: 7000 },
]
const vehicleFactors = [
  { id: 'compact', label: 'Malý vůz', factor: 1 },
  { id: 'sedan', label: 'Sedan / kombi', factor: 1.15 },
  { id: 'suv', label: 'SUV / crossover', factor: 1.3 },
  { id: 'van', label: 'Dodávka / velký vůz', factor: 1.5 },
]
const conditionFactors = [
  { id: 'normal', label: 'Běžný stav', factor: 1 },
  { id: 'dirty', label: 'Silnější znečištění', factor: 1.2 },
  { id: 'heavy', label: 'Velmi zanedbaný stav', factor: 1.4 },
]

function PriceCalculator() {
  const [serviceId, setServiceId] = useState('interior')
  const [vehicleId, setVehicleId] = useState('sedan')
  const [conditionId, setConditionId] = useState('normal')
  const service = calculatorServices.find(item => item.id === serviceId) || calculatorServices[0]
  const vehicle = vehicleFactors.find(item => item.id === vehicleId) || vehicleFactors[1]
  const condition = conditionFactors.find(item => item.id === conditionId) || conditionFactors[0]
  const estimate = Math.round(service.base * vehicle.factor * condition.factor / 100) * 100

  return (
    <section className="price-calculator reveal" aria-labelledby="price-calculator-title">
      <div className="price-calculator-heading">
        <span className="eyebrow"><i /> RYCHLÝ ODHAD</span>
        <h3 id="price-calculator-title">Spočítejte si <em>orientační cenu.</em></h3>
        <p>Vyberte službu, velikost vozu a jeho aktuální stav. Výsledek se přepočítá automaticky.</p>
      </div>
      <div className="price-calculator-controls">
        <label>Služba
          <select value={serviceId} onChange={event => setServiceId(event.target.value)}>
            {calculatorServices.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>Velikost vozidla
          <select value={vehicleId} onChange={event => setVehicleId(event.target.value)}>
            {vehicleFactors.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Stav vozidla
          <select value={conditionId} onChange={event => setConditionId(event.target.value)}>
            {conditionFactors.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="price-calculator-result" aria-live="polite">
        <div><span>VÁŠ ORIENTAČNÍ ODHAD</span><strong>{estimate.toLocaleString('cs-CZ')} Kč</strong><small>{service.name} · {vehicle.label.toLowerCase()} · {condition.label.toLowerCase()}</small></div>
        <a href="#kontakt" className="button-primary">Upřesnit cenu <ArrowUpRight size={15} /></a>
      </div>
      <p className="price-calculator-footnote">Kalkulace vychází z ukázkových startovacích cen a orientačních koeficientů. Nejde o závaznou nabídku.</p>
    </section>
  )
}

function SectionHeading({ eyebrow, title, text, light = false }) {
  return (
    <div className="section-heading reveal">
      <span className="eyebrow"><i />{eyebrow}</span>
      <h2 className={light ? 'text-[#F0EEE8]' : ''}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal, .motion-section')
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          currentObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])


  return (
    <main className="min-h-screen bg-[#151719] text-[#F0EEE8]">
      <Navbar />
      <Hero />

      <section id="sluzby" className="section-wrap services-section motion-section">
        <SectionHeading
          eyebrow="Co pro váš vůz můžeme udělat"
          title={<>Péče podle stavu.<br /><em>Ne podle šablony.</em></>}
          text="Každý vůz přijíždí v jiném stavu. Nejdřív zjistíme, co skutečně potřebuje, a teprve potom navrhneme rozsah práce."
        />
        <div className="services-grid">
          {services.map(({ number, icon: Icon, title, description, tags }) => (
            <article className="service-card reveal" key={number}>
              <div className="service-card-top">
                <span className="service-index">{number}<i />04</span>
                <span className="service-icon"><Icon size={25} strokeWidth={1.35} /></span>
              </div>
              <span className="service-watermark" aria-hidden="true">{number}</span>
              <div className="service-card-content">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <div className="service-card-bottom">
                <div className="tag-list">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <a href="#kontakt" className="text-link">Probrat službu <ArrowUpRight size={15} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="cena" className="pricing-section motion-section">
        <div className="section-wrap">
          <SectionHeading
            eyebrow="Orientační ceník"
            title={<>Kolik stojí péče<br /><em>o váš vůz?</em></>}
            text="Ukázkové ceny pro běžný osobní automobil. Větší vozy, silnější znečištění a rozsáhlejší korekce mohou cenu navýšit."
          />
          <div className="pricing-list">
            <article className="price-row reveal">
              <div><span>01 / INTERIÉR</span><h3>Hloubkové čištění interiéru</h3><p>Vysátí, čištění plastů a textilu, tepování podle materiálů a stavu.</p></div>
              <strong>od 2 500 Kč</strong>
            </article>
            <article className="price-row reveal">
              <div><span>02 / EXTERIÉR</span><h3>Mytí a dekontaminace laku</h3><p>Šetrné ruční mytí, odstranění nečistot a základní ochrana povrchu.</p></div>
              <strong>od 1 500 Kč</strong>
            </article>
            <article className="price-row reveal">
              <div><span>03 / KOREKCE</span><h3>Jednokrokové leštění laku</h3><p>Oživení lesku a omezení lehkých defektů podle stavu a tvrdosti laku.</p></div>
              <strong>od 5 000 Kč</strong>
            </article>
            <article className="price-row reveal">
              <div><span>04 / OCHRANA</span><h3>Keramická ochrana laku</h3><p>Aplikace ochranné vrstvy po odpovídající přípravě povrchu.</p></div>
              <strong>od 7 000 Kč</strong>
            </article>
          </div>
          <PriceCalculator />
          <p className="pricing-note">Výsledek je orientační výpočet z uvedených startovacích cen. Konečnou částku potvrdíme po kontrole vozu a rozsahu práce — vždy před zahájením.</p>
        </div>
      </section>

      <section id="faq" className="faq-section motion-section">
        <div className="section-wrap faq-layout">
          <SectionHeading
            eyebrow="Časté dotazy"
            title={<>Před návštěvou <em>detailingu.</em></>}
          />
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <div className={'faq-item ' + (openFaq === index ? 'is-open' : '')} key={question}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>
                  <span>{question}</span><ChevronDown size={18} />
                </button>
                {openFaq === index && <p>{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kontakt" className="contact-section motion-section">
        <div className="section-wrap contact-layout">
          <div className="contact-copy reveal">
            <span className="eyebrow"><i />Konzultace</span>
            <h2>Co potřebuje <em>váš vůz?</em></h2>
            <p>Popište nám, co chcete vyřešit. Společně projdeme možnosti a navrhneme další postup.</p>
            <div className="contact-detail"><Clock3 size={17} /><span>Termín po předchozí domluvě</span></div>
            <div className="contact-detail"><CircleDot size={17} /><span>Stříbro a okolí</span></div>
          </div>
          <div className="consult-form booking-entry-card reveal">
            <span className="eyebrow"><i /> ONLINE REZERVACE</span>
            <h3>Vyberte termín.<br /><em>Zbytek vyřešíme společně.</em></h3>
            <p>Rezervaci vytvoříte ve svém účtu. Vyberete vozidlo, službu a čas přistavení. Systém ověří kolizi s ostatními zakázkami a žádost odešle ke schválení.</p>
            <div className="booking-entry-points">
              <span><Check size={15} /> Kontrola kolizí s ostatními zakázkami</span>
              <span><ShieldCheck size={15} /> Potvrzení termínu administrátorem</span>
              <span><Clock3 size={15} /> Průběh zakázky ve vašem účtu</span>
            </div>
            <a href="/ucet?rezervace=1" className="button-primary form-submit">Rezervovat termín <ArrowUpRight size={15} /></a>
            <p className="form-privacy">Pro rezervaci je potřeba zákaznický účet. Registrace je zdarma a otevřená všem.</p>
          </div>
        </div>
      </section>

      <footer className="site-footer motion-section">
        <a href="#" className="footer-brand">AG<span>.</span><small>DETAILING</small></a>
        <p>Detailing a ochrana automobilů / Stříbro</p>
        <a href="#top" className="footer-top">Zpět nahoru <ArrowUpRight size={14} /></a>
        <small className="copyright">© {new Date().getFullYear()} AG DETAILING. Všechna práva vyhrazena.</small>
      </footer>
    </main>
  )
}

function App() {
  return window.location.pathname === '/ucet' ? <AccountPage /> : <LandingPage />
}

export default App
