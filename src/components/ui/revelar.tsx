"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Revelar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const referencia = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -8%" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={referencia}
      data-visible={visivel}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}
