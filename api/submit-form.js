export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formData, utmParams = {} } = req.body;

    if (!formData || !formData.email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // 1. Calcular Lead Score
    const leadScore = calculateLeadScore(formData);

    // 2. Mapear datos a formato HubSpot
    const hubspotPayload = {
      properties: {
        // Estándar de HubSpot
        firstname: formData.nombre?.split(' ')[0] || '',
        lastname: formData.nombre?.split(' ').slice(1).join(' ') || '',
        email: formData.email?.trim() || '',
        phone: formData.telefono || '',
        company: formData.empresa || '',
        jobtitle: formData.cargo || '',

        // Custom properties (Moldeos)
        puntaje_inicial_del_lead: leadScore.toString(),
        campaña_de_origen: utmParams.utm_source || 'moldeos.com',
        utm_medium: utmParams.utm_medium || 'direct',
        utm_campaign: utmParams.utm_campaign || 'form_submission',
        utm_content: utmParams.utm_content || 'contact_form',
        industria_interes: formData.industria || '',
        tipo_molde_interes: Array.isArray(formData.tipo_molde)
          ? formData.tipo_molde.join(';')
          : formData.tipo_molde || '',
        presupuesto_estimado: formData.presupuesto || '',
        timeframe: formData.timeframe || '',
        observaciones_del_formulario: formData.observaciones || 'Sin observaciones',
        url_del_formulario: 'https://moldeos-form.vercel.app',

        // Ciclo de vida basado en score
        lifecyclestage: leadScore >= 50 ? 'salesqualifiedlead' : 'lead',

        // Timestamp
        entrada_form: new Date().toISOString(),
      }
    };

    // 3. Llamar API de HubSpot
    const hubspotResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotPayload),
      }
    );

    const hubspotData = await hubspotResponse.json();

    // 4. Manejo de errores
    if (!hubspotResponse.ok) {
      console.error('❌ HubSpot Error:', hubspotData);
      return res.status(hubspotResponse.status).json({
        success: false,
        error: 'Error al crear contacto en HubSpot',
        details: hubspotData.message || hubspotData.errors
      });
    }

    // 5. Éxito
    console.log('✅ Contacto creado en HubSpot:', hubspotData.id);

    return res.status(201).json({
      success: true,
      contactId: hubspotData.id,
      leadScore: leadScore,
      lifecycleStage: leadScore >= 50 ? 'Sales Qualified Lead' : 'Lead',
      message: '¡Formulario recibido! Nos contactaremos en menos de 24 horas.'
    });

  } catch (error) {
    console.error('❌ Server Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Función para calcular Lead Score
function calculateLeadScore(data) {
  let score = 0;

  // Industria: +30 (alto valor), +10 (estándar)
  const industriasAltas = ['pharma', 'farmacéutica', 'pharmaceutical', 'alimentos', 'food', 'personal care', 'cuidado personal'];
  if (industriasAltas.some(ind => data.industria?.toLowerCase().includes(ind))) {
    score += 30;
  } else if (data.industria) {
    score += 10;
  }

  // Cargo: +25 (decisor)
  const cargosAltos = ['gerente', 'director', 'presidente', 'ceo', 'cto', 'manager', 'jefe', 'encargado', 'owner', 'dueño'];
  if (cargosAltos.some(cargo => data.cargo?.toLowerCase().includes(cargo))) {
    score += 25;
  }

  // Timeframe: +25 (inmediato), +15 (1-3m)
  if (data.timeframe === 'inmediato' || data.timeframe === 'immediate') {
    score += 25;
  } else if (data.timeframe === '1-3 meses' || data.timeframe === '1-3 months') {
    score += 15;
  }

  // Presupuesto: +25 (alto), +15 (medio)
  if (data.presupuesto === 'alto' || data.presupuesto === 'high') {
    score += 25;
  } else if (data.presupuesto === 'medio' || data.presupuesto === 'medium') {
    score += 15;
  }

  return Math.min(score, 100); // Máximo 100
}