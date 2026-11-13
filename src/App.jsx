import { useEffect, useState } from 'react'
import {
  ArrowDownRight, ArrowUpRight, ChevronDown,
  CircleDot, Clock3, Droplets, Gauge, ShieldCheck, Sparkles,
} from 'lucide-react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'

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

const steps = [
  ['01', 'Ozvete se', 'Napište, co s vozem potřebujete vyřešit. Pomůže i několik fotografií.'],
  ['02', 'Probereme stav vozu', 'Ujasníme si očekávání, rozsah práce a vhodný postup.'],
  ['03', 'Navrhneme řešení', 'Dostanete konkrétní doporučení a cenový odhad před zahájením práce.'],
  ['04', 'Předání vozu', 'Po dokončení si společně projdeme výsledek a doporučíme další péči.'],
]

const faqs = [
  ['Jak dlouho detailing trvá?', 'Záleží na velikosti vozu, jeho stavu a zvoleném rozsahu. Přesnější časový odhad dostanete po konzultaci.'],
  ['Musím se objednat předem?', 'Ano. Práci plánujeme po předchozí domluvě, abychom měli na vůz dostatek času.'],
  ['Dá se odstranit každý škrábanec?', 'Ne. Některé poškození je příliš hluboké nebo zasahuje pod vrstvu laku. Před leštěním proto posoudíme stav a bezpečné možnosti korekce.'],
  ['Kolik služba stojí?', 'Cena se odvíjí od rozměrů a stavu vozu i od rozsahu práce. Po upřesnění požadavku připravíme individuální kalkulaci.'],
]

function SectionHeading({ eyebrow, title, text, light = false }) {
  return (
    <div className="section-heading reveal">
      <span className="eyebrow"><i />{eyebrow}</span>
      <h2 className={light ? 'text-[#F0EEE8]' : ''}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}

function App() {
  const [openFaq, setOpenFaq] = useState(0)
  const [formMessage, setFormMessage] = useState('')

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

  function handleSubmit(event) {
    event.preventDefault()
    setFormMessage('Odesílání poptávek zatím není nastavené.')
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#151719] text-[#F0EEE8]">
      <Navbar />
      <Hero />

      <section className="trust-strip motion-section" aria-label="Přehled služeb">
        <div><span>01</span><p>Čištění interiéru</p></div>
        <div><span>02</span><p>Péče o exteriér</p></div>
        <div><span>03</span><p>Korekce a ochrana laku</p></div>
        <div><span>04</span><p>Stříbro a okolí</p></div>
      </section>

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

      <section id="cena" className="decision-section motion-section">
        <div className="section-wrap">
          <SectionHeading
            eyebrow="Cena a rozsah práce"
            title={<>Co rozhoduje o <em>ceně?</em></>}
            text="Stejná služba může u dvou aut znamenat úplně jinou práci. Předběžný odhad proto stavíme na konkrétním voze, ne na univerzálním ceníku."
          />
          <div className="decision-grid">
            <article className="decision-item reveal">
              <span>01</span>
              <h3>Velikost a typ vozu</h3>
              <p>Rozměry auta a členitost interiéru nebo karoserie ovlivňují čas potřebný na práci.</p>
            </article>
            <article className="decision-item reveal">
              <span>02</span>
              <h3>Aktuální stav</h3>
              <p>Míra znečištění, stav materiálů a poškození laku určují, co je potřeba řešit.</p>
            </article>
            <article className="decision-item reveal">
              <span>03</span>
              <h3>Požadovaný výsledek</h3>
              <p>Rozsah čištění, korekce nebo ochrany volíme podle toho, co od péče očekáváte.</p>
            </article>
          </div>
          <a href="#kontakt" className="button-secondary decision-cta">Požádat o předběžný odhad <ArrowUpRight size={15} /></a>
        </div>
      </section>

      <section id="postup" className="process-section motion-section">
        <div className="section-wrap process-layout">
          <div className="process-intro">
            <SectionHeading
              eyebrow="Jak spolupráce probíhá"
              title={<>Nejdřív plán.<br /><em>Potom práce.</em></>}
              text="Bez překvapení v rozsahu nebo ceně. Nejdřív si řekneme, co dává smysl a co od výsledku čekat."
            />
            <a href="#kontakt" className="button-primary">Domluvit konzultaci <ArrowUpRight size={16} /></a>
          </div>
          <div className="steps-list">
            {steps.map(([number, title, description]) => (
              <article className="step-row reveal" key={number}>
                <span className="step-number">{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <ArrowDownRight className="step-arrow" size={19} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="faq-section motion-section">
        <div className="section-wrap faq-layout">
          <SectionHeading
            eyebrow="Časté dotazy"
            title={<>Než se <em>domluvíme.</em></>}
            text="Pár praktických odpovědí k průběhu, rozsahu a ceně služeb."
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
          <form className="consult-form reveal" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Jméno<input name="name" placeholder="Jak vám máme říkat?" required /></label>
              <label>Telefon nebo e-mail<input name="contact" placeholder="Kam se vám ozvat?" required /></label>
            </div>
            <div className="form-row">
              <label>Vozidlo<input name="vehicle" placeholder="Značka, model, rok" /></label>
              <label>Požadovaná služba
                <select name="service" defaultValue=""><option value="" disabled>Vyberte službu</option><option>Čištění interiéru</option><option>Péče o exteriér</option><option>Korekce laku</option><option>Ochrana laku</option><option>Nejsem si jistý / jistá</option></select>
              </label>
            </div>
            <label>Co bychom měli vědět?<textarea name="message" rows="4" placeholder="Popište stav vozu nebo svou představu." /></label>
            <button className="button-primary form-submit" type="submit" disabled>Odesílání zatím není aktivní</button>
            <p className="form-privacy">Tento formulář zatím poptávku neodešle. Před zveřejněním je nutné připojit funkční odesílání a doplnit informace o zpracování osobních údajů.</p>
            {formMessage && <p className="form-message" role="status">{formMessage}</p>}
          </form>
        </div>
      </section>

      <footer className="site-footer motion-section">
        <a href="#" className="footer-brand">VRB<span>.</span><small>DETAILING</small></a>
        <p>Detailing a ochrana automobilů / Stříbro</p>
        <a href="#top" className="footer-top">Zpět nahoru <ArrowUpRight size={14} /></a>
        <small className="copyright">© {new Date().getFullYear()} VRB DETAILING. Všechna práva vyhrazena.</small>
      </footer>
    </main>
  )
}

export default App
