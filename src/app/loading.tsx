export default function Carregando() {
  return (
    <main
      className="grid min-h-svh place-items-center bg-[#07080a]"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <div className="mx-auto size-12 animate-spin rounded-full border-2 border-white/15 border-t-[#d52c3b]" />
        <p className="mt-5 text-sm text-[#aaa9a6]">Preparando a experiência…</p>
      </div>
    </main>
  );
}
