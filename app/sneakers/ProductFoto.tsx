"use client";

import { useEffect, useState } from "react";
import styles from "./sneakers.module.css";

export default function ProductFoto({ token, naam }: { token: string; naam: string }) {
  const [foto, setFoto] = useState<{ url: string; bron: string } | null>(null);
  const [geladen, setGeladen] = useState(false);
  const [mislukt, setMislukt] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/sneaker-photo?token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!controller.signal.aborted && data?.foto) setFoto(data.foto); })
      .catch(() => { /* Een ontbrekende foto mag de zoekresultaten niet verstoren. */ });
    return () => controller.abort();
  }, [token]);

  if (!foto || mislukt) return null;
  return (
    <a
      href={foto.bron}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={styles.productFoto}
      hidden={!geladen}
      aria-label={`Bekijk ${naam} bij de winkel`}
    >
      {/* Externe winkelafbeelding; rechtstreeks laden zonder extra image-proxy of AI-aanroep. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.url} alt={naam} width={160} height={128} decoding="async" referrerPolicy="no-referrer"
        onLoad={() => setGeladen(true)} onError={() => setMislukt(true)} />
    </a>
  );
}
