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

    // 2. Mapear datos a formato HubSpot - 10 PROPIEDADES CUSTOM (SIN TILDES)
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

        // 10 PROPIEDADES CUSTOM CREADAS EN HUBSPOT (SIN TILDES)
        // 1. Puntaje inicial del lead
        puntaje_inicial_del_lead: leadScore.toString(),
        
        // 2. Campaña de origen (UTM Source)
        campana_de_origen: utmParams.utm_source || 'moldeos.com',
        
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

    console.log('📤 Datos enviando a HubSpot (CONTACTO):', JSON.stringify(hubspotPayload, null, 2));

    // 3. Upsert contacto en HubSpot (crea o actualiza por email)
    const hubspotResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [{
            idProperty: 'email',
            id: formData.email.trim(),
            properties: hubspotPayload.properties,
          }]
        }),
      }
    );

    const hubspotData = await hubspotResponse.json();

    console.log('📥 Respuesta de HubSpot (CONTACTO):', hubspotData);

    // 4. Manejo de errores del contacto
    if (!hubspotResponse.ok) {
      console.error('❌ HubSpot API Error (CONTACTO):', hubspotData);
      return res.status(hubspotResponse.status).json({
        success: false,
        error: 'Error al crear/actualizar contacto en HubSpot',
        details: hubspotData.message || hubspotData.errors || JSON.stringify(hubspotData)
      });
    }

    const contactId = hubspotData.results?.[0]?.id;
    console.log('✅ ¡CONTACTO UPSERT EXITOSO EN HUBSPOT!', contactId);

    // 5. CREAR DEAL AUTOMATICAMENTE
    // ========================================================
    
    // Crear descripcion detallada del proyecto
    const dealDescription = `Nombre: ${formData.nombre}
Email: ${formData.email}
Telefono: ${formData.telefono}
Empresa: ${formData.empresa}
Industria: ${formData.industria}
Tipo Proyecto: ${formData.tipo_proyecto}
Presupuesto: ${formData.presupuesto}
Timeframe: ${formData.urgencia}
Volumen: ${formData.volumen}
Observaciones: ${formData.observaciones}
Lead Score: ${leadScore}`;


    const dealPayload = {
      properties: {
        // Nombre del deal: "Proyecto - [Empresa]"
        dealname: `Proyecto - ${formData.empresa || formData.nombre}`,
        
        // Etapa inicial: ID interno de "Contacto inicial" en HubSpot
        dealstage: '1353719346',
        
        // Monto del deal (mapear presupuesto)
        amount: mapPresupuestoToAmount(formData.presupuesto),
        
        // Fecha de cierre estimada: 30 días desde hoy
        closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // Descripción del proyecto — campo estándar de HubSpot
        description: dealDescription
      }
    };

    console.log('📤 Datos enviando a HubSpot (DEAL):', JSON.stringify(dealPayload, null, 2));

    // Crear el Deal
    const dealResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/deals',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealPayload),
      }
    );

    const dealData = await dealResponse.json();

    console.log('📥 Respuesta de HubSpot (DEAL):', dealData);

    if (!dealResponse.ok) {
      console.error('❌ HubSpot API Error (DEAL):', dealData);
      // No retornar error aquí — el contacto ya se creó, solo el deal falló
      console.warn('⚠️ El contacto se creó pero el Deal falló. Continuando...');
    } else {
      const dealId = dealData.id;
      console.log('✅ ¡DEAL CREADO EXITOSAMENTE EN HUBSPOT!', dealId);

      // 6. VINCULAR CONTACTO AL DEAL
      // ========================================================
      
      const associationPayload = {
        data: [
          {
            id: contactId
          }
        ]
      };

      const associationResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts/batch/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_PRIVATE_APP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(associationPayload),
        }
      );

      // No parsear asociación si no está OK - simplemente continuar
      if (associationResponse.ok) {
        console.log('✅ ¡CONTACTO VINCULADO AL DEAL EXITOSAMENTE!');
      } else {
        console.warn('⚠️ No se pudo vincular el contacto al deal. Continuando...');
      }
    }

    // 7. RESPUESTA FINAL
    // ========================================================
    
    return res.status(201).json({
      success: true,
      contactId: contactId,
      dealId: dealData?.id || null,
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

// FUNCIONES AUXILIARES
// ========================================================

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

// Función para mapear presupuesto a monto del deal
function mapPresupuestoToAmount(presupuesto) {
  const presupuestoMap = {
    'menos_10k': 5000,
    '10k_25k': 17500,
    '25k_50k': 37500,
    '50k_100k': 75000,
    'mas_100k': 150000
  };

  return presupuestoMap[presupuesto] || 0;
}
