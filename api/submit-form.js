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

    // 2. Mapear datos a formato HubSpot - 10 PROPIEDADES CUSTOM QUE EXISTEN
    const hubspotPayload = {
      properties: {
        // Propiedades estándar de HubSpot
        firstname: formData.nombre?.split(' ')[0] || 'Contacto',
        lastname: formData.nombre?.split(' ').slice(1).join(' ') || 'Moldeos',
        email: formData.email?.trim() || '',
        phone: formData.telefono || '',
        company: formData.empresa || '',
        jobtitle: formData.cargo || '',
        lifecyclestage: leadScore >= 50 ? 'salesqualifiedlead' : 'lead',

        // 10 PROPIEDADES CUSTOM CREADAS EN HUBSPOT
        // 1. Puntaje inicial del lead
        puntaje_inicial_del_lead: leadScore.toString(),
        
        // 2. Campaña de origen (UTM Source)
        campaña_de_origen: utmParams.utm_source || 'moldeos.com',
        
        // 3. UTM Medium
        utm_medium: utmParams.utm_medium || 'form_multi_step',
        
        // 4. UTM Campaign
        utm_campaign: utmParams.utm_campaign || 'project_qualifier',
        
        // 5. Industria de interés
        industria_interes: formData.industria || '',
        
        // 6. Tipo de proyecto
        tipo_proyecto: formData.tipo_proyecto || '',
        
        // 7. Presupuesto estimado
        presupuesto_estimado: formData.presupuesto || '',
        
        // 8. Timeframe
        timeframe: formData.urgencia || '',
        
        // 9. Observaciones del formulario
        observaciones_del_formulario: formData.descripcion || 'Sin observaciones',
        
        // 10. Volumen estimado mensual
        volumen: formData.volumen || ''
      }
    };

    console.log('📤 Datos enviando a HubSpot:', JSON.stringify(hubspotPayload, null, 2));

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

    console.log('📥 Respuesta de HubSpot:', hubspotData);

    // 4. Manejo de errores
    if (!hubspotResponse.ok) {
      console.error('❌ HubSpot API Error:', hubspotData);
      return res.status(hubspotResponse.status).json({
        success: false,
        error: 'Error al crear contacto en HubSpot',
        details: hubspotData.message || hubspotData.errors || JSON.stringify(hubspotData)
      });
    }

    // 5. Éxito - Contacto creado
    console.log('✅ ¡CONTACTO CREADO EXITOSAMENTE EN HUBSPOT!', hubspotData.id);
    
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

  // Urgencia: +25 (urgente), +15 (corto)
  if (data.urgencia === 'urgente') {
    score += 25;
  } else if (data.urgencia === 'corto') {
    score += 15;
  }

  // Presupuesto: +25 (alto), +15 (medio)
  if (data.presupuesto === 'mas_100k') {
    score += 25;
  } else if (data.presupuesto === '50k_100k') {
    score += 15;
  }

  return Math.min(score, 100);
}