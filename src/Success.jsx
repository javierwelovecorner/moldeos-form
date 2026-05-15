export default function Success() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F0FDF4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        maxWidth: 580,
        width: "100%",
        background: "#fff",
        border: "2px solid #86EFAC",
        borderRadius: 20,
        padding: "44px 36px",
        textAlign: "center",
        boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
      }}>
        <span style={{
          display: "inline-block",
          background: "#16A34A",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "5px 14px",
          borderRadius: 99,
          marginBottom: 20,
        }}>
          ✅ Solicitud Recibida
        </span>

        <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: 16,
          lineHeight: 1.3,
        }}>
          ¡Gracias por tu solicitud!
        </h1>

        <p style={{
          fontSize: 16,
          color: "#475569",
          lineHeight: 1.7,
          marginBottom: 28,
        }}>
          Hemos recibido tu información de proyecto correctamente. Un ingeniero de Moldeos Especializados se contactará contigo en menos de <strong>24 horas hábiles</strong>.
        </p>

        <div style={{
          background: "#F0FDF4",
          borderRadius: 12,
          padding: "20px 16px",
          marginBottom: 28,
          border: "1px solid #86EFAC",
        }}>
          <p style={{
            fontSize: 13,
            color: "#15803D",
            fontWeight: 600,
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}>
            <span>📧</span>
            Revisa tu correo (incluyendo spam) para más detalles
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}>
          <div style={{
            background: "#F8FAFC",
            borderRadius: 12,
            padding: "16px",
            border: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>⏱️</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              Próximo Paso
            </div>
            <div style={{ fontSize: 11, color: "#64748B" }}>
              Evaluación técnica del proyecto
            </div>
          </div>

          <div style={{
            background: "#F8FAFC",
            borderRadius: 12,
            padding: "16px",
            border: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>📞</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              ¿Preguntas?
            </div>
            <div style={{ fontSize: 11, color: "#64748B" }}>
              Contacta a ventas@moldeos.com
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: "#16A34A",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "15px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
            fontFamily: "inherit",
          }}
        >
          Volver al sitio
        </button>

        <p style={{
          fontSize: 11,
          color: "#94A3B8",
          marginTop: 20,
          marginBottom: 0,
        }}>
          🔒 Tu información es confidencial · Moldeos Especializados
        </p>
      </div>
    </div>
  );
}
