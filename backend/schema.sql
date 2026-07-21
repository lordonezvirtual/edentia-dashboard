-- SQL Database Initialization Script for Edentia CRM
CREATE SCHEMA IF NOT EXISTS edentia_crm;

-- 1. Tabla de Leads
CREATE TABLE IF NOT EXISTS edentia_crm.leads (
    lead_id SERIAL PRIMARY KEY,
    empresa VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    contacto_nombre VARCHAR(255),
    correo VARCHAR(255),
    whatsapp VARCHAR(50),
    sitio_web VARCHAR(255),
    hallazgos_scraping TEXT,
    servicio_edentia_sugerido VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Encontrado',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Propuestas Enviadas y Seguimiento
CREATE TABLE IF NOT EXISTS edentia_crm.propuestas (
    propuesta_id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES edentia_crm.leads(lead_id) ON DELETE CASCADE,
    version_propuesta INT DEFAULT 1,
    ruta_archivo_word VARCHAR(500),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_respuesta VARCHAR(50) DEFAULT 'Pendiente',
    fecha_seguimiento_s1 TIMESTAMP,
    fecha_seguimiento_s2 TIMESTAMP
);

-- 3. Tabla de Entrevistas y Diagnóstico IA
CREATE TABLE IF NOT EXISTS edentia_crm.diagnosticos (
    diagnostico_id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES edentia_crm.leads(lead_id) ON DELETE CASCADE,
    transcripcion_entrevista TEXT,
    analisis_ia_diagnostico JSONB,
    nivel_madurez_ia VARCHAR(50),
    fecha_entrevista TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Proyectos y Planes de Trabajo
CREATE TABLE IF NOT EXISTS edentia_crm.proyectos (
    proyecto_id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES edentia_crm.leads(lead_id) ON DELETE CASCADE,
    monto_total NUMERIC(12,2),
    orden_trabajo_ref VARCHAR(100),
    ruta_excel_plan VARCHAR(500),
    estado_proyecto VARCHAR(50) DEFAULT 'Pre-Facturado',
    fecha_inicio DATE,
    fecha_fin_estimada DATE
);

-- 5. Tabla de Trazabilidad Agéntica
CREATE TABLE IF NOT EXISTS edentia_crm.trazabilidad_agentes (
    log_id SERIAL PRIMARY KEY,
    agente_nombre VARCHAR(100) NOT NULL,
    modelo_llm VARCHAR(50) NOT NULL,
    lead_id INT REFERENCES edentia_crm.leads(lead_id) ON DELETE CASCADE,
    accion_realizada TEXT NOT NULL,
    input_payload JSONB,
    output_payload JSONB,
    tokens_usados INT,
    fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_ciudad ON edentia_crm.leads(ciudad);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON edentia_crm.leads(estado);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_agente ON edentia_crm.trazabilidad_agentes(agente_nombre);

-- Limpiar tablas antes de insertar para garantizar consistencia en la demo
TRUNCATE TABLE edentia_crm.trazabilidad_agentes RESTART IDENTITY CASCADE;
TRUNCATE TABLE edentia_crm.proyectos RESTART IDENTITY CASCADE;
TRUNCATE TABLE edentia_crm.diagnosticos RESTART IDENTITY CASCADE;
TRUNCATE TABLE edentia_crm.propuestas RESTART IDENTITY CASCADE;
TRUNCATE TABLE edentia_crm.leads RESTART IDENTITY CASCADE;

-- Insertar Leads Semilla
INSERT INTO edentia_crm.leads (empresa, ciudad, contacto_nombre, correo, whatsapp, sitio_web, hallazgos_scraping, servicio_edentia_sugerido, estado, fecha_creacion)
VALUES 
('Auteco SAS', 'Pereira', 'Carlos Gómez', 'carlos.gomez@auteco.com.co', '+57 312 456 7890', 'www.auteco.com.co', 'Línea de ensamblaje masiva. Alto volumen de reportes de calidad manuales, sin observabilidad de modelos predictivos de fallas y necesidad de entrenamiento XR para mecánicos.', 'Aura', 'Ganado', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('Comfamiliar Risaralda', 'Pereira', 'Diana Restrepo', 'diana.restrepo@comfamiliar.com', '+57 315 789 1234', 'www.comfamiliar.com', 'Red de clínicas y recreación. Necesita automatización de turnos médicos e IA gobernada para el manejo de datos de pacientes (cumplimiento normativo de salud).', 'Aegis', 'Contactado', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('Comestibles La Rosa', 'Dosquebradas', 'Héctor Fabio', 'hector.fabio@larosa.com', '+57 310 111 2222', 'www.nestle-larosa.com.co', 'Planta de producción de alimentos. Alta rotación de personal en empaque primario. Requiere interfaces neuronales o gestuales para el manejo sin contacto de terminales en área limpia.', 'Synapse', 'Propuesta_Enviada', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('Grupo Nutresa', 'Medellín', 'Andrés Restrepo', 'arestrepo@nutresa.com.co', '+57 300 222 3333', 'www.gruponutresa.com', 'Conglomerado multi-latina de alimentos. Interés en auditorías de modelos de previsión de demanda y optimización de rutas comerciales mediante agentes.', 'Forge', 'Encontrado', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('Bancolombia', 'Bogotá', 'María Camila Torres', 'mctorres@bancolombia.com.co', '+57 311 999 8888', 'www.bancolombia.com', 'Banco comercial líder. Tiene más de 50 modelos predictivos y genAI en producción sin un framework unificado de gobernanza y mitigación de sesgos.', 'Aegis', 'Ganado', CURRENT_TIMESTAMP - INTERVAL '20 days'),
('Kosta Azul', 'Pereira', 'Juan Fernando', 'jfernando@kostazul.com', '+57 313 777 5555', 'www.kostazul.com', 'Compañía textil de moda masculina. Procesos de diseño y patronaje manuales. Podrían beneficiarse de una solución de visualización en realidad virtual (XR) para catálogos.', 'Aura', 'Encontrado', CURRENT_TIMESTAMP - INTERVAL '1 days');

-- Insertar Propuestas Semilla
INSERT INTO edentia_crm.propuestas (lead_id, version_propuesta, ruta_archivo_word, fecha_envio, estado_respuesta, fecha_seguimiento_s1, fecha_seguimiento_s2)
VALUES 
(1, 1, '/downloads/propuestas/Propuesta_Auteco_SAS.docx', CURRENT_TIMESTAMP - INTERVAL '14 days', 'Aceptada_Reunion', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP),
(3, 1, '/downloads/propuestas/Propuesta_Comestibles_La_Rosa.docx', CURRENT_TIMESTAMP - INTERVAL '8 days', 'Pendiente', CURRENT_TIMESTAMP - INTERVAL '1 days', CURRENT_TIMESTAMP + INTERVAL '6 days'),
(5, 1, '/downloads/propuestas/Propuesta_Bancolombia.docx', CURRENT_TIMESTAMP - INTERVAL '19 days', 'Aceptada_Reunion', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(5, 2, '/downloads/propuestas/Propuesta_Bancolombia_V2.docx', CURRENT_TIMESTAMP - INTERVAL '10 days', 'Aceptada_Reunion', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '4 days');

-- Insertar Diagnósticos Semilla
INSERT INTO edentia_crm.diagnosticos (lead_id, transcripcion_entrevista, analisis_ia_diagnostico, nivel_madurez_ia, fecha_entrevista)
VALUES 
(1, 'El cliente Carlos Gómez manifiesta que tienen una tasa de error del 3% en ensamble por mala capacitación. Proponemos un gemelo digital interactivo con Unity para gafas Xreal.', '{"arquitectura_sugerida": "Plataforma Unity + SDK Aura + Xreal Light Glasses", "dolores_principales": ["Errores de ensamble", "Costos de capacitación presencial"], "servicios_requeridos": ["Desarrollo Unity 3D", "Modelado Blender de piezas", "Integración de tracking gestual"]}'::jsonb, 'Inicial', CURRENT_TIMESTAMP - INTERVAL '12 days'),
(5, 'Reunión técnica de riesgos. Tienen modelos de evaluación de crédito y chatbots en producción con riesgos de alucinaciones y sesgo de género detectados en prensa.', '{"arquitectura_sugerida": "Edentia Aegis Engine + OpenTelemetry IA + Dashboard de Cumplimiento", "dolores_principales": ["Riesgo reputacional por sesgo de IA", "Falta de observabilidad en tiempo real"], "servicios_requeridos": ["Auditoría de sesgos", "Monitoreo continuo de prompts", "Configuración de alertas de deriva"]}'::jsonb, 'Repetible', CURRENT_TIMESTAMP - INTERVAL '15 days');

-- Insertar Proyectos Semilla
INSERT INTO edentia_crm.proyectos (lead_id, monto_total, orden_trabajo_ref, ruta_excel_plan, estado_proyecto, fecha_inicio, fecha_fin_estimada)
VALUES 
(1, 45000000.00, 'OT-2026-001', '/downloads/proyectos/Plan_Proyecto_Auteco_SAS.xlsx', 'En_Ejecucion', '2026-07-10', '2026-10-10'),
(5, 95000000.00, 'OT-2026-002', '/downloads/proyectos/Plan_Proyecto_Bancolombia.xlsx', 'Pre-Facturado', '2026-08-01', '2026-12-15');

-- Insertar Logs de Trazabilidad de Agentes Semilla
INSERT INTO edentia_crm.trazabilidad_agentes (agente_nombre, modelo_llm, lead_id, accion_realizada, input_payload, output_payload, tokens_usados)
VALUES 
('Agent_01_LeadFinder', 'Gemini-1.5-Flash', 1, 'Búsqueda geográfica de empresas grandes en Pereira. Coincidencia encontrada.', '{"region": "Pereira, Risaralda", "tipo_empresa": "Manufactura grande"}'::jsonb, '{"empresa": "Auteco SAS", "contacto": "Carlos Gómez", "correo": "carlos.gomez@auteco.com.co"}'::jsonb, 1200),
('Agent_02_DeepScraper', 'Gemini-1.5-Flash', 1, 'Scraping sitio web de Auteco SAS. Identificación de dolores operativos.', '{"url": "http://www.auteco.com.co"}'::jsonb, '{"dolores": "Uso de guías PDF estáticas para ensamblaje complejo, sin entrenamiento dinámico en XR."}'::jsonb, 3500),
('Agent_03_ProposalBuilder', 'Claude-3.5-Sonnet', 1, 'Generación de propuesta inicial personalizada en Word (Aura).', '{"dolor": "Uso de guías PDF estáticas para ensamblaje", "linea_sugerida": "Aura (XR)"}'::jsonb, '{"archivo_generado": "Propuesta_Auteco_SAS.docx", "precio_sugerido": "$45.000.000 COP"}'::jsonb, 4800),
('Agent_04_FollowUpNotifier', 'Gemini-1.5-Flash', 1, 'Programación de alertas de seguimiento y envío automático de correo Semana 1.', '{"lead_id": 1, "dias_transcurridos": 7}'::jsonb, '{"accion": "Correo de seguimiento Semana 1 enviado a carlos.gomez@auteco.com.co"}'::jsonb, 850),
('Agent_05_InterviewDiagnostic', 'Claude-3.5-Sonnet', 1, 'Análisis de transcripción de entrevista comercial y asignación de nivel de madurez de IA.', '{"transcripcion": "El cliente Carlos Gómez manifiesta..."}'::jsonb, '{"madurez": "Inicial", "diagnostico": "Requiere gemelo digital interactivo Unity"}'::jsonb, 6200),
('Agent_06_FormalProposalEngine', 'Claude-3.5-Sonnet', 1, 'Estructuración de propuesta formal técnico-comercial.', '{"diagnostico_id": 1}'::jsonb, '{"alcance": "Modelado 3D de 5 motores, simulación de ensamble, guía paso a paso en Xreal VR.", "costo": 45000000}'::jsonb, 7100),
('Agent_07_PreInvoiceGenerator', 'Gemini-1.5-Pro', 1, 'Creación de orden de trabajo OT-2026-001 tras aceptación de propuesta formal.', '{"lead_id": 1, "monto": 45000000}'::jsonb, '{"ot_referencia": "OT-2026-001", "prefactura": "Generada en PDF"}'::jsonb, 2200),
('Agent_08_ProjectPlanArchitect', 'Claude-3.5-Sonnet', 1, 'Diseño de Plan de Trabajo en Excel (XLSX) con WBS.', '{"ot_referencia": "OT-2026-001"}'::jsonb, '{"archivo_generado": "Plan_Proyecto_Auteco_SAS.xlsx", "hitos": 4}'::jsonb, 5500),
('Agent_09_AccountContinuity', 'Claude-3.5-Sonnet', 1, 'Evaluación de post-venta para venta cruzada (Aegis + Synapse).', '{"proyecto_id": 1}'::jsonb, '{"sugerencia": "Ofrecer Synapse (tracking gestual Mudra Band) para interactuar sin contacto en Unity con gafas Xreal, y Aegis para auditoría de calidad mediante IA."}'::jsonb, 3900);
