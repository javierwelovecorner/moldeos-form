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

    // 2. Mapear datos a formato HubSpot (usando SOLO propiedades que existem)
    const hubspotPayload = {
      properties: {
        // Propiedades estándar de HubSpot (estas SIEMPRE existen)
        firstname: formData.nombre?.split(' ')[0] || '',
        lastname: formData.nombre?.split(' ').slice(1).join(' ') || '',
        email: formData.email?.trim() || '',
        phone: formData.telefono || '',
        company: formData.empresa || '',
        jobtitle: formData.cargo || '',
        
        // Propiedades custom - usando names_con_guion_bajo (snake_case)
        // Estas deben coincidir EXACTAMENTE con lo que creaste en HubSpot
        puntaje_inicial_del_lead: leadScore.toString(),
        campaña_de_origen: utmParams.utm_source || 'moldeos.com',
        utm_medium: utmParams.utm_medium || 'form_multi_step',
        utm_campaign: utmParams.utm_campaign || 'project_qualifier',
        industria_interes: formData.industria || '',
        presupuesto_estimado: formData.presupuesto || '',
        timeframe: formData.urgencia || '',
        observaciones_del_formulario: formData.descripcion || 'Sin observaciones',
        
        // Ciclo de vida basado en score
        lifecyclestage: leadScore >= 50 ? 'salesqualifiedlead' : 'lead',
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

  // Timeframe/Urgencia: +25 (inmediato), +15 (corto)
  if (data.urgencia === 'urgente' || data.timeframe === 'urgente') {
    score += 25;
  } else if (data.urgencia === 'corto' || data.timeframe === 'corto') {
    score += 15;
  }

  // Presupuesto: +25 (alto), +15 (medio)
  if (data.presupuesto === 'mas_100k' || data.presupuesto === 'alto') {
    score += 25;
  } else if (data.presupuesto === '50k_100k' || data.presupuesto === 'medio') {
    score += 15;
  }

  return Math.min(score, 100); // Máximo 100
}