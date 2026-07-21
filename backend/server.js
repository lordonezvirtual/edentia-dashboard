const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static downloads
const publicDir = path.join(__dirname, 'public');
const proposalsDir = path.join(publicDir, 'downloads', 'propuestas');
const projectsDir = path.join(publicDir, 'downloads', 'proyectos');

fs.mkdirSync(proposalsDir, { recursive: true });
fs.mkdirSync(projectsDir, { recursive: true });

app.use(express.static(publicDir));

// --- HELPER FUNCTIONS FOR FILE GENERATION ---

// Generates a real Word (.docx) proposal
async function generateDocxProposal(companyName, suggestedService) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `PROPUESTA COMERCIAL CUSTOMIZADA: ${companyName.toUpperCase()}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Preparado por: Edentia Soluciones Tecnológicas SAS`,
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: `Línea de Servicio Sugerida: Edentia ${suggestedService}`,
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `\nEstimados miembros del equipo de ${companyName},\n\n`,
                bold: true,
              }),
              new TextRun(
                `Basado en el análisis de su presencia digital y necesidades operativas, hemos detectado oportunidades clave de mejora mediante el uso de Inteligencia Artificial y tecnologías avanzadas. A continuación, presentamos nuestra propuesta comercial inicial:\n\n`
              ),
            ],
          }),
          new Paragraph({
            text: "1. Dolor Identificado & Solución Sugerida",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `Para su necesidad específica en la línea de negocio, proponemos la implementación de Edentia ${suggestedService}. Esta solución optimizará sus flujos de trabajo actuales y permitirá gobernanza o visualización de vanguardia.`,
          }),
          new Paragraph({
            text: "\n2. Estimación Comercial Preliminar",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `Inversión total estimada: $45.000.000 COP a $95.000.000 COP, dependiendo del alcance técnico final definido en la sesión de diagnóstico profundo.`,
          }),
          new Paragraph({
            text: "\n3. Próximo Paso (Llamado a la Acción)",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "Agendar la entrevista de diagnóstico comercial técnico inicial con nuestros arquitectos para definir el alcance exacto (Scope of Work).",
          }),
        ],
      },
    ],
  });

  const fileName = `Propuesta_${companyName.replace(/\s+/g, '_')}.docx`;
  const filePath = path.join(proposalsDir, fileName);
  
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  
  return `/downloads/propuestas/${fileName}`;
}

// Generates a real Excel (.xlsx) project plan
async function generateExcelProjectPlan(companyName, otRef) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plan de Trabajo');

  worksheet.columns = [
    { header: 'WBS', key: 'wbs', width: 8 },
    { header: 'Nombre de la Tarea', key: 'name', width: 35 },
    { header: 'Fecha Inicio', key: 'start', width: 15 },
    { header: 'Fecha Fin', key: 'end', width: 15 },
    { header: 'Responsable', key: 'resource', width: 20 },
    { header: 'Estado', key: 'status', width: 15 },
  ];

  worksheet.addRow({ wbs: '1', name: 'Inicio del Proyecto y Kickoff', start: '2026-08-01', end: '2026-08-05', resource: 'Project Manager', status: 'Completado' });
  worksheet.addRow({ wbs: '2', name: 'Diseño de Arquitectura Técnica', start: '2026-08-06', end: '2026-08-20', resource: 'Arquitecto Principal', status: 'En Progreso' });
  worksheet.addRow({ wbs: '3', name: 'Desarrollo e Implementación', start: '2026-08-21', end: '2026-10-15', resource: 'Equipo Dev Edentia', status: 'Pendiente' });
  worksheet.addRow({ wbs: '4', name: 'Pruebas Integrales y UAT', start: '2026-10-16', end: '2026-10-30', resource: 'QA Specialist', status: 'Pendiente' });
  worksheet.addRow({ wbs: '5', name: 'Despliegue y Cierre', start: '2026-11-01', end: '2026-11-05', resource: 'DevOps / PM', status: 'Pendiente' });

  // Styles
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E1E24' } // Zinc Dark style
  };

  const fileName = `Plan_Proyecto_${companyName.replace(/\s+/g, '_')}.xlsx`;
  const filePath = path.join(projectsDir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return `/downloads/proyectos/${fileName}`;
}

// --- API ENDPOINTS ---

// Fetch all leads
app.get('/api/leads', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM edentia_crm.leads ORDER BY lead_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching leads' });
  }
});

// Create new lead manually
app.post('/api/leads', async (req, res) => {
  const { empresa, ciudad, contacto_nombre, correo, whatsapp, sitio_web, servicio_edentia_sugerido } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO edentia_crm.leads (empresa, ciudad, contacto_nombre, correo, whatsapp, sitio_web, servicio_edentia_sugerido, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Encontrado') RETURNING *`,
      [empresa, ciudad, contacto_nombre, correo, whatsapp, sitio_web, servicio_edentia_sugerido]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error creating lead' });
  }
});

// Fetch all proposals
app.get('/api/propuestas', async (req, res) => {
  try {
    const result = await db.query('SELECT p.*, l.empresa FROM edentia_crm.propuestas p JOIN edentia_crm.leads l ON p.lead_id = l.lead_id ORDER BY p.propuesta_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching proposals' });
  }
});

// Fetch all diagnostics
app.get('/api/diagnosticos', async (req, res) => {
  try {
    const result = await db.query('SELECT d.*, l.empresa FROM edentia_crm.diagnosticos d JOIN edentia_crm.leads l ON d.lead_id = l.lead_id ORDER BY d.diagnostico_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching diagnostics' });
  }
});

// Fetch all projects
app.get('/api/proyectos', async (req, res) => {
  try {
    const result = await db.query('SELECT pr.*, l.empresa, l.servicio_edentia_sugerido FROM edentia_crm.proyectos pr JOIN edentia_crm.leads l ON pr.lead_id = l.lead_id ORDER BY pr.proyecto_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching projects' });
  }
});

// Fetch all traceability logs
app.get('/api/logs', async (req, res) => {
  try {
    const result = await db.query('SELECT t.*, l.empresa FROM edentia_crm.trazabilidad_agentes t LEFT JOIN edentia_crm.leads l ON t.lead_id = l.lead_id ORDER BY t.log_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching logs' });
  }
});

// Fetch database metrics (Tokens, city distribution, etc.)
app.get('/api/metrics', async (req, res) => {
  try {
    const counts = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM edentia_crm.leads) as total_leads,
        (SELECT COUNT(*) FROM edentia_crm.propuestas) as total_propuestas,
        (SELECT COUNT(*) FROM edentia_crm.diagnosticos) as total_diagnosticos,
        (SELECT COUNT(*) FROM edentia_crm.proyectos WHERE estado_proyecto = 'En_Ejecucion' OR estado_proyecto = 'Entregado') as total_proyectos_ganados,
        (SELECT COALESCE(SUM(monto_total), 0) FROM edentia_crm.proyectos) as facturacion_estimada
    `);
    
    const geo = await db.query(`
      SELECT ciudad, COUNT(*) as count FROM edentia_crm.leads GROUP BY ciudad
    `);

    const tokens = await db.query(`
      SELECT 
        SUM(CASE WHEN modelo_llm LIKE 'Claude%' THEN tokens_usados ELSE 0 END) as claude_tokens,
        SUM(CASE WHEN modelo_llm LIKE 'Gemini%' THEN tokens_usados ELSE 0 END) as gemini_tokens
      FROM edentia_crm.trazabilidad_agentes
    `);

    res.json({
      summary: counts.rows[0],
      geography: geo.rows,
      tokens: {
        claude: parseInt(tokens.rows[0].claude_tokens || '0'),
        gemini: parseInt(tokens.rows[0].gemini_tokens || '0')
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching metrics' });
  }
});

// Pipeline Candidate leads database
const prospectCandidates = [
  { empresa: 'Suzuki Risaralda', ciudad: 'Pereira', contacto_nombre: 'Santiago Mejía', correo: 'santiago.mejia@suzuki.com.co', whatsapp: '+57 320 666 4444', sitio_web: 'www.suzuki.com.co', sugerido: 'Aura' },
  { empresa: 'Ingenio Risaralda', ciudad: 'La Virginia', contacto_nombre: 'Liliana Uribe', correo: 'luribe@ingeniorisaralda.com', whatsapp: '+57 318 444 9999', sitio_web: 'www.ingeniorisaralda.com.co', sugerido: 'Forge' },
  { empresa: 'Magnetrón SAS', ciudad: 'Pereira', contacto_nombre: 'Alberto Arias', correo: 'aarias@magnetron.com.co', whatsapp: '+57 317 222 8888', sitio_web: 'www.magnetron.com.co', sugerido: 'Aegis' },
  { empresa: 'Papeles Nacionales', ciudad: 'Cartago', contacto_nombre: 'Marta Cecilia', correo: 'mcecilia@papelesnacionales.com', whatsapp: '+57 312 888 1111', sitio_web: 'www.papelesnacionales.com', sugerido: 'Synapse' },
  { empresa: 'Frigorífico Otún', ciudad: 'Pereira', contacto_nombre: 'Jorge Giraldo', correo: 'jgiraldo@frigo-otun.com.co', whatsapp: '+57 316 555 3333', sitio_web: 'www.frigootun.com.co', sugerido: 'Forge' }
];

// Run simulated pipeline for a lead (creates a new lead or uses an existing one)
app.post('/api/agents/run', async (req, res) => {
  let leadId = req.body.lead_id;
  let targetLead;

  try {
    if (!leadId) {
      // Find a candidate not already imported
      const existingResult = await db.query('SELECT empresa FROM edentia_crm.leads');
      const existingNames = existingResult.rows.map(r => r.empresa.toLowerCase());
      
      const candidate = prospectCandidates.find(c => !existingNames.includes(c.empresa.toLowerCase())) || prospectCandidates[Math.floor(Math.random() * prospectCandidates.length)];
      
      // Create new Lead (Agent_01 LeadFinder + Agent_02 Scraper)
      const leadRes = await db.query(
        `INSERT INTO edentia_crm.leads (empresa, ciudad, contacto_nombre, correo, whatsapp, sitio_web, servicio_edentia_sugerido, estado, hallazgos_scraping)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Encontrado', $8) RETURNING *`,
        [
          candidate.empresa,
          candidate.ciudad,
          candidate.contacto_nombre,
          candidate.correo,
          candidate.whatsapp,
          candidate.sitio_web,
          candidate.sugerido,
          `Escaneo web completado. Se detecta falta de automatización y alto volumen de datos manuales. Se sugiere implementar Edentia ${candidate.sugerido} para potenciar la eficiencia.`
        ]
      );
      targetLead = leadRes.rows[0];
      leadId = targetLead.lead_id;

      // Agent 1 Log
      await db.query(
        `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Agent_01_LeadFinder',
          'Gemini-1.5-Flash',
          leadId,
          `Lead localizado en escaneo regional de ${targetLead.ciudad}.`,
          JSON.stringify({ region: targetLead.ciudad, empresa: targetLead.empresa }),
          JSON.stringify(targetLead),
          1150
        ]
      );

      // Agent 2 Log
      await db.query(
        `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Agent_02_DeepScraper',
          'Gemini-1.5-Flash',
          leadId,
          `Escaneo profundo del sitio ${targetLead.sitio_web} y presencia digital. Dolores identificados.`,
          JSON.stringify({ sitio_web: targetLead.sitio_web }),
          JSON.stringify({ hallazgos: targetLead.hallazgos_scraping }),
          2400
        ]
      );
    } else {
      const leadRes = await db.query('SELECT * FROM edentia_crm.leads WHERE lead_id = $1', [leadId]);
      if (leadRes.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
      targetLead = leadRes.rows[0];
    }

    // Sequentially run all remaining agents up to continuity
    const service = targetLead.servicio_edentia_sugerido;
    const empresa = targetLead.empresa;

    // 3. Agent_03_ProposalBuilder (Claude)
    const wordPath = await generateDocxProposal(empresa, service);
    const propRes = await db.query(
      `INSERT INTO edentia_crm.propuestas (lead_id, version_propuesta, ruta_archivo_word, estado_respuesta, fecha_seguimiento_s1, fecha_seguimiento_s2)
       VALUES ($1, 1, $2, 'Pendiente', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '14 days') RETURNING *`,
      [leadId, wordPath]
    );
    await db.query(
      `UPDATE edentia_crm.leads SET estado = 'Propuesta_Enviada' WHERE lead_id = $1`,
      [leadId]
    );
    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_03_ProposalBuilder',
        'Claude-3.5-Sonnet',
        leadId,
        `Redacción y generación de propuesta preliminar (.docx) para Edentia ${service}.`,
        JSON.stringify({ dolor: targetLead.hallazgos_scraping, servicio: service }),
        JSON.stringify(propRes.rows[0]),
        4500
      ]
    );

    // 4. Agent_04_FollowUpNotifier
    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_04_FollowUpNotifier',
        'Gemini-1.5-Flash',
        leadId,
        `Establecimiento de alertas de correo automáticas en el sistema de base de datos para los días +7 y +14.`,
        JSON.stringify({ correo_destino: targetLead.correo, propuestas_id: propRes.rows[0].propuesta_id }),
        JSON.stringify({ alerta_s1: 'Programada', alerta_s2: 'Programada' }),
        700
      ]
    );

    // 5. Agent_05_InterviewDiagnostic (Claude)
    const transcriptText = `El cliente ${targetLead.contacto_nombre} de ${empresa} atendió la reunión matutina. Confirma que la propuesta preliminar en Word de Edentia ${service} le pareció sumamente interesante. Explica detalladamente su flujo de trabajo manual y solicita cotización formal incluyendo soporte anual.`;
    const diagAnalysis = {
      arquitectura_sugerida: `Arquitectura Edentia ${service} Standard Enterprise`,
      dolores_principales: ['Falta de observabilidad de flujos', 'Baja eficiencia manual'],
      servicios_requeridos: [`Implantación Edentia ${service}`, 'Capacitación del personal', 'Soporte 24/7']
    };
    const diagRes = await db.query(
      `INSERT INTO edentia_crm.diagnosticos (lead_id, transcripcion_entrevista, analisis_ia_diagnostico, nivel_madurez_ia)
       VALUES ($1, $2, $3, 'Inicial') RETURNING *`,
      [leadId, transcriptText, JSON.stringify(diagAnalysis)]
    );
    await db.query(
      `UPDATE edentia_crm.leads SET estado = 'Prospecto_Calificado' WHERE lead_id = $1`,
      [leadId]
    );
    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_05_InterviewDiagnostic',
        'Claude-3.5-Sonnet',
        leadId,
        `Procesamiento de transcripción y generación de matriz de madurez técnica de IA.`,
        JSON.stringify({ transcripcion: transcriptText }),
        JSON.stringify(diagRes.rows[0]),
        5300
      ]
    );

    // 6. Agent_06_FormalProposalEngine (Claude)
    const formalCosto = 65000000.00;
    await db.query(
      `UPDATE edentia_crm.propuestas SET estado_respuesta = 'Aceptada_Reunion', version_propuesta = 2 WHERE propuesta_id = $1`,
      [propRes.rows[0].propuesta_id]
    );
    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_06_FormalProposalEngine',
        'Claude-3.5-Sonnet',
        leadId,
        `Generación de propuesta formal técnica. Definición de hitos, alcance final y cotización comercial por $65M COP.`,
        JSON.stringify({ diagnostico_id: diagRes.rows[0].diagnostico_id }),
        JSON.stringify({ alcances: diagAnalysis.servicios_requeridos, costo: formalCosto }),
        6200
      ]
    );

    // 7. Agent_07_PreInvoiceGenerator
    const otRef = `OT-2026-${String(leadId).padStart(3, '0')}`;
    await db.query(
      `UPDATE edentia_crm.leads SET estado = 'Ganado' WHERE lead_id = $1`,
      [leadId]
    );
    const projRes = await db.query(
      `INSERT INTO edentia_crm.proyectos (lead_id, monto_total, orden_trabajo_ref, estado_proyecto, fecha_inicio, fecha_fin_estimada)
       VALUES ($1, $2, $3, 'Pre-Facturado', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days') RETURNING *`,
      [leadId, formalCosto, otRef]
    );
    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_07_PreInvoiceGenerator',
        'Gemini-1.5-Pro',
        leadId,
        `Generación automática de pre-factura y orden de trabajo comercial (${otRef}) tras aceptación.`,
        JSON.stringify({ lead_id: leadId, monto: formalCosto }),
        JSON.stringify(projRes.rows[0]),
        1800
      ]
    );

    // 8. Agent_08_ProjectPlanArchitect (Claude/Gemini)
    const excelPath = await generateExcelProjectPlan(empresa, otRef);
    await db.query(
      `UPDATE edentia_crm.proyectos SET ruta_excel_plan = $1, estado_proyecto = 'En_Ejecucion' WHERE proyecto_id = $2`,
      [excelPath, projRes.rows[0].proyecto_id]
    );
    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_08_ProjectPlanArchitect',
        'Claude-3.5-Sonnet',
        leadId,
        `Planificación del WBS técnico del proyecto. Creación y formato de archivo de cronograma en Excel (.xlsx).`,
        JSON.stringify({ orden_trabajo: otRef, empresa: empresa }),
        JSON.stringify({ excel_path: excelPath }),
        5100
      ]
    );

    // 9. Agent_09_AccountContinuity (Claude)
    let upsellSugerido = '';
    if (service === 'Forge') upsellSugerido = 'Ofrecer Edentia Aegis para asegurar la gobernanza, observabilidad y control de los modelos de IA integrados.';
    else if (service === 'Aura') upsellSugerido = 'Ofrecer Edentia Synapse (decodificación neuronal mediante Mudra Band) para control de gestos interactivo sin contacto físico.';
    else if (service === 'Aegis') upsellSugerido = 'Ofrecer Edentia Forge para construir nuevos agentes inteligentes autónomos que respondan a las anomalías de los modelos.';
    else upsellSugerido = 'Ofrecer interfaces Aura XR integradas para entrenamiento inmersivo del personal.';

    await db.query(
      `INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'Agent_09_AccountContinuity',
        'Claude-3.5-Sonnet',
        leadId,
        `Análisis de continuidad de cuenta de cliente finalizado. Alertas de cross-selling / upselling enviadas al dashboard.`,
        JSON.stringify({ servicio_comprado: service }),
        JSON.stringify({ sugerencia_upsell: upsellSugerido }),
        3200
      ]
    );

    res.json({
      success: true,
      lead_id: leadId,
      empresa: empresa,
      servicio: service,
      proposal_file: wordPath,
      project_plan_file: excelPath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error during agent pipeline run' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
