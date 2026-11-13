import { ArrowDown, ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative flex h-[100svh] min-h-[760px] items-center overflow-hidden bg-[#151719] max-[700px]:min-h-[720px]">
      {/* Temporary hero photograph — replace with an original project photo later. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-[center_58%]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=85')",
        }}
      />

      <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#151719] via-[#151719]/75 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#151719] via-transparent to-black/25"
      />
      <div
        aria-hidden="true"
        className="carbon-panel absolute inset-0 opacity-[0.13] mix-blend-soft-light"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-12 pt-20 max-[700px]:px-6 max-[700px]:pt-16">
        <div className="max-w-[780px]">
          <div className="animate-fade-up mb-8 flex items-center gap-3 max-[700px]:mb-6">
            <span className="h-px w-10 bg-[#D40000]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/75 max-[700px]:text-[9px]">
              Automobilový detailing / Stříbro
            </span>
          </div>

          <h1 className="animate-fade-up delay-1 text-[clamp(42px,5.1vw,76px)] font-extrabold leading-[1.08] tracking-[-0.065em] text-[#F0EEE8]">
            Detailing a ochrana
            <br />
            automobilů ve Stříbře.
          </h1>

          <p className="animate-fade-up delay-2 mt-8 max-w-[540px] text-[15px] leading-8 text-white/70 max-[700px]:mt-6 max-[700px]:text-[13px] max-[700px]:leading-7">
            Čištění interiéru, korekce laku a jeho ochrana.
            Každý vůz posuzujeme individuálně podle jeho
            stavu a požadovaného výsledku.
          </p>

          <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center gap-4 max-[700px]:mt-8">
            <a href="#kontakt" className="button-primary group">
              <span>Domluvit konzultaci</span>
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </a>

            <a href="#sluzby" className="button-secondary">
              Prohlédnout služby
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-12 right-12 z-10 flex items-center justify-between border-t border-white/15 pt-5 max-[700px]:bottom-6 max-[700px]:left-6 max-[700px]:right-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          VRB DETAILING / STŘÍBRO
        </span>

        <a
          href="#sluzby"
          className="scroll-indicator flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/65 transition-colors hover:text-white"
        >
          Prozkoumat stránky
          <ArrowDown size={14} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
