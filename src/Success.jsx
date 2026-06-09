import { useEffect } from "react";

export default function Success() {
  useEffect(() => {
    // Google tag (gtag.js) - Google Ads conversion
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = "https://www.googletagmanager.com/gtag/js?id=AW-18163857886";
    document.head.appendChild(script1);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", "AW-18163857886");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F0FDF4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", border: "2px solid #86EFAC", borderRadius: 20, padding: "44px 36px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "#16A34A", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 99, marginBottom: 20 }}>
          Formulario enviado
        </span>
        <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginBottom: 12, lineHeight: 1.3 }}>¡Tu proyecto está en buenas manos!</h2>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 24 }}>
          Hemos recibido tu información y nuestro equipo técnico la está revisando. Un ingeniero de proyectos se pondrá en contacto contigo en menos de 24 horas hábiles.
        </p>
        <div style={{ background: "#ECFDF5", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <span>🕐</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>Respuesta en menos de 24 hrs hábiles</span>
        </div>
        <button onClick={() => window.location.href = '/'} style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: 12, padding: "15px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
          Volver al inicio
        </button>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 16 }}>
          Si tienes dudas mientras tanto, no dudes en escribir a contacto@moldeos.com
        </p>
      </div>
    </div>
  );
}