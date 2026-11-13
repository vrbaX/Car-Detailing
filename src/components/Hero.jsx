import { ArrowDown, ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[760px] h-[100svh] items-center overflow-hidden bg-[#111315] max-[700px]:min-h-[720px]">
      <div aria-hidden="true" className="hero-backdrop absolute inset-0" />
      <div aria-hidden="true" className="absolute inset-0 bg-[#090b0d]/50" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#111315] via-[#111315]/80 to-[#111315]/10" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#111315] via-transparent to-[#111315]/35" />
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-12 pt-20 max-[700px]:px-6 max-[700px]:pt-16">
        <div className="max-w-[780px]">
          <div className="animate-fade-up mb-8 flex items-center gap-3 max-[700px]:mb-6">
            <span className="h-px w-10 bg-[#D40000]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/75">Detailing automobilů / Stříbro</span>
          </div>
          <h1 className="animate-fade-up delay-1 text-[clamp(42px,5.1vw,76px)] font-extrabold leading-[1.08] tracking-[-0.065em] text-[#F0EEE8]">
            Detailing a ochrana<br />automobilů ve Stříbře.
          </h1>
          <p className="animate-fade-up delay-2 mt-8 max-w-[540px] text-[14px] leading-8 text-white/70 max-[700px]:mt-6 max-[700px]:text-[13px] max-[700px]:leading-7">
            Čištění interiéru, korekce laku a jeho ochrana. Každý vůz posuzujeme podle skutečného stavu a toho, co od výsledku očekáváte.
          </p>
          <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center gap-3 max-[700px]:mt-8">
            <a href="#kontakt" className="button-primary group"><span>Domluvit konzultaci</span><ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" /></a>
            <a href="#sluzby" className="button-secondary">Prohlédnout služby</a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-9 left-12 right-12 z-10 flex items-center justify-between border-t border-white/15 pt-5 max-[700px]:bottom-6 max-[700px]:left-6 max-[700px]:right-6">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">VRB DETAILING / STŘÍBRO</span>
        <a href="#sluzby" className="scroll-indicator flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/65 transition-colors hover:text-white">Prozkoumat stránky <ArrowDown size={14} /></a>
      </div>
    </section>
  )
}
