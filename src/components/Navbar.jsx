import { ArrowUpRight, ChevronDown } from 'lucide-react'

const navigation = [
  { label: 'Služby', href: '#sluzby' },
  { label: 'Odhad ceny', href: '#cena' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full border-b border-white/[0.08] bg-[#111315]/65 backdrop-blur-xl">
      <nav className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-12 max-[700px]:h-[70px] max-[700px]:px-5" aria-label="Hlavní navigace">
        <a href="#top" aria-label="VRB DETAILING — úvodní stránka" className="flex items-center gap-3">
          <span className="text-[31px] font-extrabold tracking-[-0.09em]">VRB<span className="text-[#D40000]">.</span></span>
          <span className="h-7 w-px bg-white/20" />
          <span className="text-[9px] font-bold tracking-[0.24em] text-white/65">DETAILING</span>
        </a>
        <div className="desktop-nav-links flex items-center gap-9">
          {navigation.map(item => (
            <a key={item.label} href={item.href} className="group relative py-2 text-[11px] font-bold tracking-[0.06em] text-white/70 transition-colors duration-200 hover:text-white">
              {item.label}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-[#D40000] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>
        <details className="mobile-nav">
          <summary>Menu <ChevronDown size={14} /></summary>
          <div className="mobile-nav-panel">
            {navigation.map(item => <a key={item.label} href={item.href}>{item.label}</a>)}
          </div>
        </details>
        <a href="#kontakt" className="button-nav group">
          <span>Poptat službu</span>
          <ArrowUpRight size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </nav>
    </header>
  )
}
