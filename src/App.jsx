import React, { useState } from "react";

const steps = [
  {
    id: "empresa",
    title: "Cuéntanos sobre tu empresa",
    fields: [
      { id: "nombre", label: "Nombre completo", type: "text", placeholder: "Ej. Carlos Mendoza" },
      { id: "empresa", label: "Empresa", type: "text", placeholder: "Ej. Grupo Industrial del Norte" },
      { id: "cargo", label: "Cargo", type: "text", placeholder: "Ej. Gerente de Ingeniería" },
      { id: "email", label: "Correo electrónico", type: "email", placeholder: "carlos@empresa.com" },
      { id: "telefono", label: "Teléfono / WhatsApp", type: "tel", placeholder: "+52 81 0000 0000" },
    ],
  },
  {
    id: "proyecto",
    title: "¿Qué tipo de proyecto tienes en mente?",
    fields: [{
      id: "tipo_proyecto", label: "Tipo de proyecto", type: "radio",
      options: [
        { value: "molde_nuevo", label: "🔧 Fabricación de molde nuevo", desc: "Diseño y manufactura de molde de inyección" },
        { value: "inyeccion", label: "🏭 Servicio de inyección de plástico", desc: "Producción de piezas con molde existente o nuevo" },
        { value: "llave_en_mano", label: "📦 Proyecto llave en mano", desc: "Diseño de pieza + molde + primeras corridas de producción" },
        { value: "no_seguro", label: "🤔 Aún no estoy seguro", desc: "Necesito asesoría para definir el alcance" },
      ],
    }],
  },
  {
    id: "industria",
    title: "¿En qué industria opera tu empresa?",
    fields: [{
      id: "industria", label: "Sector", type: "radio",
      options: [
        { value: "alimentos", label: "🥫 Alimentos y bebidas" },
        { value: "cosmetico", label: "💄 Cosmético y cuidado personal" },
        { value: "farmaceutico", label: "💊 Farmacéutico" },
        { value: "automotriz", label: "🚗 Automotriz" },
        { value: "electronico", label: "💡 Electrónico / industrial" },
        { value: "otro", label: "🔲 Otro sector" },
      ],
    }],
  },
  {
    id: "detalles",
    title: "Detalles técnicos del proyecto",
    fields: [
      {
        id: "tiene_plano", label: "¿Cuentas con plano técnico o especificación de la pieza?", type: "radio",
        options: [
          { value: "si_completo", label: "✅ Sí, tengo plano completo" },
          { value: "si_parcial", label: "📋 Tengo especificaciones parciales" },
          { value: "no", label: "❌ Aún no tengo plano" },
        ],
      },
      {
        id: "volumen", label: "Volumen estimado de producción mensual", type: "radio",
        options: [
          { value: "menos_1k", label: "Menos de 1,000 piezas/mes" },
          { value: "1k_10k", label: "1,000 – 10,000 piezas/mes" },
          { value: "10k_100k", label: "10,000 – 100,000 piezas/mes" },
          { value: "mas_100k", label: "Más de 100,000 piezas/mes" },
          { value: "no_definido", label: "Volumen aún no definido" },
        ],
      },
      {
        id: "cavidades", label: "Número de cavidades requeridas (si aplica)", type: "radio",
        options: [
          { value: "1", label: "1 cavidad" },
          { value: "2_4", label: "2 – 4 cavidades" },
          { value: "mas_4", label: "Más de 4 cavidades" },
          { value: "no_se", label: "No lo sé aún" },
        ],
      },
    ],
  },
  {
    id: "contexto",
    title: "Contexto y tiempos del proyecto",
    fields: [
      {
        id: "urgencia", label: "¿Cuál es tu horizonte de tiempo?", type: "radio",
        options: [
          { value: "urgente", label: "🔴 Urgente — necesito iniciar en menos de 1 mes" },
          { value: "corto", label: "🟡 Corto plazo — 1 a 3 meses" },
          { value: "mediano", label: "🟢 Mediano plazo — 3 a 6 meses" },
          { value: "explorando", label: "⚪ Estoy evaluando opciones" },
        ],
      },
      {
        id: "presupuesto", label: "Rango de inversión estimada", type: "radio",
        options: [
          { value: "menos_50k", label: "Menos de $50,000 USD" },
          { value: "50k_100k", label: "$50,000 – $100,000 USD" },
          { value: "mas_100k", label: "Más de $100,000 USD" },
          { value: "no_definido", label: "Aún no tenemos presupuesto definido" },
        ],
      },
      {
        id: "descripcion", label: "Describe brevemente tu proyecto (opcional)", type: "textarea",
        placeholder: "Ej. Necesitamos un molde de 4 cavidades para envase de 250ml para la industria cosmética, con requerimientos FDA...",
      },
    ],
  },
];

const SCORE_MAP = {
  tiene_plano: { si_completo: 3, si_parcial: 2, no: 0 },
  volumen: { menos_1k: 0, "1k_10k": 1, "10k_100k": 2, mas_100k: 3, no_definido: 1 },
  presupuesto: { menos_50k: 0, "50k_100k": 2, mas_100k: 3, no_definido: 1 },
  urgencia: { urgente: 2, corto: 2, mediano: 1, explorando: 0 },
  cavidades: { "1": 1, "2_4": 2, mas_4: 3, no_se: 1 },
};

function calcScore(a) {
  return Object.entries(SCORE_MAP).reduce(
    (acc, [f, map]) => acc + (a[f] && map[a[f]] !== undefined ? map[a[f]] : 0), 0
  );
}

function getResult(score, answers) {
  if (answers.tipo_proyecto === "no_seguro" || score < 4) return {
    tag: "En evaluación", icon: "📋", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D",
    title: "Tu proyecto está en etapa exploratoria",
    message: "Antes de avanzar técnicamente, un ingeniero puede ayudarte a definir el alcance y los requerimientos. No necesitas tener todo claro para dar el primer paso.",
    cta: "Agendar llamada de diagnóstico",
    time: "Te contactamos en 24 hrs hábiles",
  };
  if (score < 9) return {
    tag: "Oportunidad calificada", icon: "✅", color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD",
    title: "Tu proyecto tiene buen potencial",
    message: "Tenemos capacidad técnica para acompañarte. Un ingeniero de proyectos revisará tu información y te contactará para definir los siguientes pasos.",
    cta: "Enviar información al equipo técnico",
    time: "Respuesta en menos de 24 hrs hábiles",
  };
  return {
    tag: "Proyecto prioritario", icon: "🏆", color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC",
    title: "Tu proyecto es exactamente lo que hacemos",
    message: "Cumple con nuestros criterios de proyecto estratégico: volumen, complejidad técnica e inversión. Recibirás atención de un ingeniero senior.",
    cta: "Enviar — contacto prioritario",
    time: "Un ingeniero senior te contacta en menos de 4 hrs",
  };
}

export default function App() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progressPct = ((step + 1) / steps.length) * 100;

  function setValue(id, val) {
    setAnswers(p => ({ ...p, [id]: val }));
    setErrors(p => ({ ...p, [id]: false }));
  }

  function validate() {
    const e = {};
    current.fields.forEach(f => {
      if (f.type === "textarea") return;
      if (!answers[f.id] || String(answers[f.id]).trim() === "") e[f.id] = true;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (isLast) { setSubmitted(true); return; }
    setStep(s => s + 1);
  }

  const score = calcScore(answers);
  const result = getResult(score, answers);

  const s = {
    page: { minHeight: "100vh", background: "#F1F5F9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 16px", fontFamily: "'Inter', system-ui, sans-serif" },
    wrap: { maxWidth: 580, width: "100%" },
    card: { background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", padding: "32px 28px", marginBottom: 16 },
    h2: { fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 24, lineHeight: 1.3 },
    label: { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" },
    input: (err) => ({ width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${err ? "#EF4444" : "#D1D5DB"}`, outline: "none", boxSizing: "border-box", color: "#0F172A", background: "#FAFAFA", fontFamily: "inherit" }),
    textarea: { width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 10, border: "1.5px solid #D1D5DB", outline: "none", boxSizing: "border-box", color: "#0F172A", resize: "vertical", background: "#FAFAFA", fontFamily: "inherit" },
    radioBtn: (sel, err) => ({ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", border: sel ? "2px solid #0F172A" : err ? "1.5px solid #EF4444" : "1.5px solid #E2E8F0", background: sel ? "#F8FAFC" : "#FAFAFA", transition: "all 0.12s ease", fontFamily: "inherit" }),
    radioCircle: (sel) => ({ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1, border: sel ? "5px solid #0F172A" : "2px solid #CBD5E1", transition: "all 0.12s ease", boxSizing: "border-box" }),
    btnPrimary: { flex: 2, padding: 14, borderRadius: 10, border: "none", background: "#0F172A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    btnSecondary: { flex: 1, padding: 14, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", fontSize: 14, fontWeight: 500, color: "#64748B", cursor: "pointer", fontFamily: "inherit" },
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={{ ...s.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ background: result.bg, border: `2px solid ${result.border}`, borderRadius: 20, padding: "44px 36px", textAlign: "center", width: "100%" }}>
            <span style={{ display: "inline-block", background: result.color, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 99, marginBottom: 20 }}>
              {result.tag}
            </span>
            <div style={{ fontSize: 40, marginBottom: 14 }}>{result.icon}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 10, lineHeight: 1.3 }}>{result.title}</h2>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 24 }}>{result.message}</p>
            <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span>🕐</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: result.color }}>{result.time}</span>
            </div>
            <button style={{ background: result.color, color: "#fff", border: "none", borderRadius: 12, padding: "15px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginBottom: 12, fontFamily: "inherit" }}>
              {result.cta} →
            </button>
            <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>
              Un representante de Moldeos Especializados te contactará en el plazo indicado.
            </p>
            <button style={{ background: "none", border: "none", color: result.color, fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
              onClick={() => { setSubmitted(false); setStep(0); setAnswers({}); setErrors({}); }}>
              ← Volver a empezar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ ...s.wrap, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "#0F172A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>M</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>Moldeos Especializados</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Formulario de contacto técnico</div>
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Paso {step + 1} / {steps.length}</span>
        </div>
        <div style={{ background: "#E2E8F0", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ background: "#0F172A", height: "100%", borderRadius: 99, width: `${progressPct}%`, transition: "width 0.35s ease" }} />
        </div>
      </div>

      <div style={{ ...s.wrap, ...s.card }}>
        <h2 style={s.h2}>{current.title}</h2>

        {current.fields.map(field => (
          <div key={field.id} style={{ marginBottom: 22 }}>
            <label style={s.label}>
              {field.label}
              {errors[field.id] && <span style={{ color: "#EF4444", fontWeight: 400, marginLeft: 6, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>— requerido</span>}
            </label>

            {(field.type === "text" || field.type === "email" || field.type === "tel") && (
              <input type={field.type} placeholder={field.placeholder} value={answers[field.id] || ""}
                onChange={e => setValue(field.id, e.target.value)} style={s.input(errors[field.id])} />
            )}

            {field.type === "textarea" && (
              <textarea placeholder={field.placeholder} value={answers[field.id] || ""}
                onChange={e => setValue(field.id, e.target.value)} rows={4} style={s.textarea} />
            )}

            {field.type === "radio" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {field.options.map(opt => {
                  const sel = answers[field.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setValue(field.id, opt.value)} style={s.radioBtn(sel, errors[field.id])}>
                      <div style={s.radioCircle(sel)} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: sel ? 600 : 400, color: "#0F172A" }}>{opt.label}</div>
                        {opt.desc && <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{opt.desc}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={s.btnSecondary}>← Atrás</button>}
          <button onClick={next} style={s.btnPrimary}>
            {isLast ? "Enviar solicitud →" : "Continuar →"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
        🔒 Tu información es confidencial · Respondemos en menos de 24 hrs hábiles · moldeos.com
      </p>
    </div>
  );
}
