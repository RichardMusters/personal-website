export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm text-zinc-600 font-medium tracking-tight">
          Richard Musters
        </span>
        <span className="text-xs text-zinc-700">
          &copy; {new Date().getFullYear()} &middot; Rotterdam, Nederland
        </span>
        <div className="flex items-center gap-6">
          <a
            href="#about"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            Over mij
          </a>
          <a
            href="#experience"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            Ervaring
          </a>
          <a
            href="#contact"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
