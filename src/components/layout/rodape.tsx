import Link from "next/link";

export function Rodape() {
  return (
    <footer className="section-line py-10 text-sm text-[#858783]">
      <div className="container-site flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <p>
          © {new Date().getFullYear()} A Cicatriz. Projeto audiovisual escolar.
        </p>
        <div className="flex gap-5">
          <Link href="/assistir" className="hover:text-white">
            Assistir
          </Link>
          <Link href="/#creditos" className="hover:text-white">
            Créditos
          </Link>
        </div>
      </div>
    </footer>
  );
}
