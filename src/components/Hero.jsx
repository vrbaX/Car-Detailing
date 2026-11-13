import { ArrowDown, ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section id="top" className="hero-section">
      <video
        className="hero-video"
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://images.pexels.com/photos/14615262/pexels-photo-14615262.jpeg?auto=compress&cs=tinysrgb&w=1800"
      >
        <source src="https://videos.pexels.com/video-files/4822920/4822920-uhd_3840_2160_25fps.mp4" type="video/mp4" />
      </video>
      <div aria-hidden="true" className="hero-backdrop" />
      <div aria-hidden="true" className="hero-mark">VRB<span>.</span></div>
      <div className="hero-content">
        <div className="hero-copy">
          <div className="animate-fade-up mb-8 flex items-center gap-3 max-[700px]:mb-6">
            <span className="h-px w-10 bg-[#D40000]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75">Detailing automobilů / Stříbro</span>
          </div>
          <h1 className="animate-fade-up delay-1">
            Detailing a ochrana<br />automobilů ve Stříbře.
          </h1>
          <p className="animate-fade-up delay-2">
            Čištění interiéru, korekce laku a jeho ochrana. Vyberte si službu nebo se ozvěte pro doporučení podle stavu vašeho vozu.
          </p>
          <div className="animate-fade-up delay-3 hero-actions">
            <a href="#kontakt" className="button-primary group"><span>Domluvit konzultaci</span><ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" /></a>
            <a href="#sluzby" className="button-secondary">Prohlédnout služby</a>
          </div>
          <a href="#sluzby" className="hero-scroll">Prohlédnout nabídku <ArrowDown size={14} /></a>
        </div>
      </div>
      <span className="hero-image-credit">Video: Gustavo Fring / Pexels · Foto: Dextar Studio / Pexels</span>
    </section>
  )
}
