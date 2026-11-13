import { useState } from 'react'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown,
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

  function handleSubmit(event) {
    event.preventDefault()
    setFormMessage('Formulář je zatím pouze návrh. Před spuštěním je potřeba připojit odesílání poptávek.')
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#151719] text-[#F0EEE8]">
      <Navbar />
      <Hero />

      <section className="trust-strip" aria-label="Přístup k práci">
        <div><span>01</span><p>Individuální posouzení vozu</p></div>
        <div><span>02</span><p>Rozsah práce po domluvě</p></div>
        <div><span>03</span><p>Cena před zahájením</p></div>
        <div><span>04</span><p>Stříbro a okolí</p></div>
      </section>

      <section id="sluzby" className="section-wrap services-section">
        <SectionHeading
          eyebrow="Co pro váš vůz můžeme udělat"
          title={<>Péče podle stavu.<br /><em>Ne podle šablony.</em></>}
          text="Každý vůz přijíždí v jiném stavu. Nejdřív zjistíme, co skutečně potřebuje, a teprve potom navrhneme rozsah práce."
        />
        <div className="services-grid">
          {services.map(({ number, icon: Icon, title, description, tags }) => (
            <article className="service-card reveal" key={number}>
              <div className="service-card-top"><span>{number} / 04</span><Icon size={22} strokeWidth={1.5} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="tag-list">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              <a href="#kontakt" className="text-link">Probrat službu <ArrowUpRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>

      <section id="realizace" className="work-section">
        <div className="section-wrap">
          <SectionHeading
            eyebrow="Práce na vozech"
            title={<>Rozhodují <em>detaily.</em></>}
            text="Výsledek má být vidět na povrchu, v interiéru i v tom, jak snadno se o vůz dál stará."
          />
          <div className="work-grid">
            <div className="work-image work-image-main reveal">
              <img src="https://images.unsplash.com/photo-1600705722907-3a7e7a1c1f4d?auto=format&fit=crop&w=1400&q=85" alt="Detail karoserie automobilu" loading="lazy" />
              <span className="image-caption">Povrch a lak <b>01</b></span>
            </div>
            <div className="work-image reveal">
              <img src="https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1000&q=85" alt="Detail interiéru automobilu" loading="lazy" />
              <span className="image-caption">Interiér <b>02</b></span>
            </div>
            <div className="work-image reveal">
              <img src="https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=1000&q=85" alt="Čistý automobil po péči" loading="lazy" />
              <span className="image-caption">Péče o exteriér <b>03</b></span>
            </div>
          </div>
          <p className="gallery-note">Ukázkové fotografie. Nahradit vlastními fotografiemi skutečných realizací před zveřejněním.</p>
        </div>
      </section>

      <section className="process-section">
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

      <section id="o-nas" className="about-section">
        <div className="about-photo">
          <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=85" alt="Práce na detailu automobilu" loading="lazy" />
          <div className="photo-stamp"><span>VRB.</span><small>DETAILING / STŘÍBRO</small></div>
        </div>
        <div className="about-copy reveal">
          <span className="eyebrow"><i />Přístup VRB DETAILING</span>
          <h2>Žádné univerzální balíčky. <em>Nejdřív se podíváme na vůz.</em></h2>
          <p>Rozdíl mezi běžným umytím a detailingem není v počtu použitých přípravků. Je v tom, že se zvolí správný postup pro konkrétní povrch, materiál a stav vozidla.</p>
          <p>Proto začínáme rozhovorem a posouzením. Doporučíme jen práci, která má pro váš vůz skutečný přínos.</p>
          <a href="#kontakt" className="text-link">Probrat váš vůz <ArrowUpRight size={15} /></a>
        </div>
      </section>

      <section className="faq-section">
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

      <section id="kontakt" className="contact-section">
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
            <button className="button-primary form-submit" type="submit">Připravit poptávku <ArrowRight size={16} /></button>
            <p className="form-privacy">Odesílání formuláře bude aktivní po připojení e-mailu nebo formulářové služby.</p>
            {formMessage && <p className="form-message" role="status">{formMessage}</p>}
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <a href="#" className="footer-brand">VRB<span>.</span><small>DETAILING</small></a>
        <p>Detailing a ochrana automobilů / Stříbro</p>
        <a href="#top" className="footer-top">Zpět nahoru <ArrowUpRight size={14} /></a>
        <small className="copyright">© {new Date().getFullYear()} VRB DETAILING. Všechna práva vyhrazena.</small>
      </footer>
    </main>
  )
}

export default App
