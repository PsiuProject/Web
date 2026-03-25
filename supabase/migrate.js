// Migration script: transforms hardcoded project data into Supabase inserts
// Run with: node supabase/migrate.js
// Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read .env manually since we're in Node
const envPath = resolve(__dirname, '../.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Hardcoded project data (from src/stores/data/projects.js) ──────────────
const projectsData = [
  {
    id: 'p1', type: 'active', size: 'card-lg', year: 2025,
    statusTag: 'status.pnab',
    title: 'PRATA CULT',
    description: 'Profissionalização de jovens (18-29 anos) em música e audiovisual.',
    territory: 'Brasil', axis: ['Arte', 'Tecnologia'],
    kpiLabel: 'labels.estimatedImpact', kpiValue: null, kpiDetail: '1 Álbum / 10 Docs / 1 Festival',
    meta: [
      { labelKey: 'project.partners', value: 'SOS Águas da Prata, Mídia Ninja' },
      { labelKey: 'project.role', value: 'RCC Escrita técnica & Coordenação' }
    ],
    category: 'culture', parentId: null, connectionType: null
  },
  {
    id: 'p2', type: 'active', size: 'card-md', year: 2024,
    statusTag: 'status.cultsp',
    title: 'OFICINAS SEMANAIS',
    description: 'Workshops gratuitos: Música, Audiovisual, Agroecologia e Gestão de Projetos na SOS Águas da Prata.',
    territory: 'Brasil', axis: ['Arte', 'Água', 'Tecnologia'],
    kpiLabel: 'labels.formation', kpiValue: null, kpiDetail: 'Base da Banda Impermanente',
    meta: [
      { labelKey: 'project.award', value: 'Prêmio 11 anos - Gov. SP' },
      { labelKey: 'project.origin', value: 'Prêmio CultSP - 11 anos de atuação' }
    ],
    category: 'culture', parentId: null, connectionType: null
  },
  {
    id: 'p3', type: 'active', size: 'card-md', year: 2025,
    statusTag: 'status.virada2026',
    title: 'BEE GUARDIANS MELIPONARY',
    description: 'Workshops de meliponicultura (abelhas nativas sem ferrão) com escolas e comunidade.',
    territory: 'Brasil', axis: ['Água'],
    kpiLabel: 'labels.biodiversity', kpiValue: null, kpiDetail: 'Abelhas Nativas Sem Ferrão',
    meta: [
      { labelKey: 'project.location', value: 'SOS - Horta Parque' },
      { labelKey: 'project.type', value: 'Educação Ambiental' }
    ],
    category: 'environmental', parentId: 'p18', connectionType: 'connections.subProject'
  },
  {
    id: 'p4', type: 'active', size: 'card-md', year: 2025,
    statusTag: 'status.virada2026',
    title: 'JARDIM MEDICINAL',
    description: 'Horta comunitária, atividades escolares, preservação de árvores nativas e frutíferas.',
    territory: 'Brasil', axis: ['Água'],
    kpiLabel: 'labels.saf', kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.location', value: 'SOS - Horta Parque' },
      { labelKey: 'project.connection', value: 'Meliponário' }
    ],
    category: 'environmental', parentId: 'p18', connectionType: 'connections.subProject'
  },
  {
    id: 'p4b', type: 'active', size: 'card-sm', year: 2027,
    statusTag: 'status.virada2027',
    title: 'VIRADA CLIMÁTICA 2027',
    description: '4ª Edição - Celebração de 13 Anos de EG South America: 12 dias de atividades socioambientais.',
    territory: 'Brasil', axis: ['Arte', 'Direitos'],
    kpiLabel: 'labels.duration', kpiValue: null, kpiDetail: 'Janeiro-Fevereiro 2027',
    meta: [
      { labelKey: 'project.edition', value: '4ª Edição' },
      { labelKey: 'project.type', value: 'Celebração & Rede' }
    ],
    category: 'climate', parentId: null, connectionType: null
  },
  {
    id: 'p4c', type: 'active', size: 'card-lg', year: 2025,
    statusTag: 'status.active',
    title: 'EARTH DOC',
    description: 'Cobertura completa documental de todo o trabalho EG South America. COP30, Virada Climática, Vulcan Festival.',
    territory: 'Brasil', axis: ['Arte', 'Direitos'],
    kpiLabel: 'labels.format', kpiValue: null, kpiDetail: 'Documentário, Fotos, Textos',
    meta: [
      { labelKey: 'project.focus', value: 'COP30 + Virada Climática + Vulcan Festival' },
      { labelKey: 'project.format', value: 'Documentário, Fotos, Textos' }
    ],
    category: 'climate', parentId: null, connectionType: null
  },
  {
    id: 'p5', type: 'pipeline', size: 'card-lg', year: 2027,
    statusTag: 'status.submission',
    title: 'VULCAN OBSERVATORY',
    description: 'Pesquisa em zonas de sacrifício e impacto da mineração de Terras Raras. Segurança, Defesa e Restauração.',
    territory: 'Brasil', axis: ['Água', 'Direitos'],
    kpiLabel: 'labels.territorialDefense', kpiValue: null, kpiDetail: 'Áreas de Terras Raras',
    meta: [
      { labelKey: 'project.status', value: 'Mapeamento Sul/Centro América' },
      { labelKey: 'project.scope', value: 'Segurança, Defesa, Restauração' }
    ],
    category: 'climate', parentId: null, connectionType: null
  },
  {
    id: 'p6', type: 'pipeline', size: 'card-md', year: 2026,
    statusTag: 'status.submission',
    title: 'MONITORAMENTO CORPOS D\'ÁGUA',
    description: 'Advocacy e pesquisa contínua de corpos d\'água, flora e fauna.',
    territory: 'Brasil', axis: ['Água'],
    kpiLabel: null, kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.type', value: 'Pesquisa & Advocacy' },
      { labelKey: 'project.connection', value: 'Vulcan Observatory' }
    ],
    category: 'environmental', parentId: 'p5', connectionType: 'connections.research'
  },
  {
    id: 'p7', type: 'pipeline', size: 'card-sm', year: 2026,
    statusTag: 'status.submission',
    title: 'KIT AMIGXS DA ÁGUA',
    description: 'Análise e controle de pH e qualidade da água com kits caseiros e acessíveis.',
    territory: 'Brasil', axis: ['Água', 'Tecnologia'],
    kpiLabel: null, kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.origin', value: 'Escola São Roque' },
      { labelKey: 'project.production', value: 'SOS Águas da Prata' }
    ],
    category: 'environmental', parentId: 'p5', connectionType: 'connections.tool'
  },
  {
    id: 'p8', type: 'pipeline', size: 'card-sm', year: 2027,
    statusTag: 'status.submission',
    title: 'MAPEAMENTO ZONAS DE SACRIFÍCIO',
    description: 'Mapeamento inicial de comunidades vulneráveis na América do Sul e Central.',
    territory: 'Brasil', axis: ['Direitos'],
    kpiLabel: null, kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.scope', value: 'Sul/Centro América' },
      { labelKey: 'project.connection', value: 'Vulcan Observatory' }
    ],
    category: 'climate', parentId: 'p5', connectionType: 'connections.mapping'
  },
  {
    id: 'p9', type: 'pipeline', size: 'card-sm', year: 2027,
    statusTag: 'status.submission',
    title: 'SEGURANÇA RADIOLÓGICA E ALIMENTAR',
    description: 'Áreas estratégicas de foco do observatório - radiologia e segurança alimentar.',
    territory: 'Brasil', axis: ['Água', 'Direitos'],
    kpiLabel: null, kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.focus', value: 'Radiologia & Alimentos' },
      { labelKey: 'project.connection', value: 'Vulcan Observatory' }
    ],
    category: 'climate', parentId: 'p5', connectionType: 'connections.focusArea'
  },
  {
    id: 'p10', type: 'pipeline', size: 'card-md', year: 2026,
    statusTag: 'status.writing',
    title: 'ECOTRACK MAPBIOMAS',
    description: 'Ferramentas geohidrográficas para catalogação comunitária de nascentes e monitoramento de bacias.',
    territory: 'Brasil', axis: ['Água', 'Tecnologia'],
    kpiLabel: 'labels.grantPhase', kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.type', value: 'MapBiomas + Geohidrografia' },
      { labelKey: 'project.scope', value: 'Nascentes & Bacias' }
    ],
    category: 'environmental', parentId: 'p5', connectionType: 'connections.tracking'
  },
  {
    id: 'p14', type: 'done', size: 'card-lg', year: 2016,
    statusTag: 'status.historic',
    title: 'XÔ MINERADORAS',
    description: 'Movimento comunitário contra mineração de bauxita que ameaçava fontes de água. Base para Vulcan Observatory.',
    territory: 'Brasil', axis: ['Água', 'Direitos'],
    kpiLabel: 'labels.communityVictory', kpiValue: null, kpiDetail: 'Concurso Curta Prata 2016',
    meta: [
      { labelKey: 'project.legacy', value: 'Videoclipe "A Mensagem da Onça"' },
      { labelKey: 'project.sponsorship', value: 'Banco do Brasil' }
    ],
    category: 'climate', parentId: null, connectionType: null
  },
  {
    id: 'p14b', type: 'done', size: 'card-sm', year: 2016,
    statusTag: 'status.award',
    title: 'A MENSAGEM DA ONÇA',
    description: 'Videoclipe expondo a crise climática e vozes jovens emergentes. Vencedor do Concurso Curta Prata 2016.',
    territory: 'Brasil', axis: ['Arte'],
    kpiLabel: 'labels.award', kpiValue: null, kpiDetail: 'Concurso Curta Prata 2016',
    meta: [
      { labelKey: 'project.sponsorship', value: 'Banco do Brasil' },
      { labelKey: 'project.connection', value: 'Xô Mineradoras' }
    ],
    category: 'culture', parentId: 'p14', connectionType: 'connections.culturalProduction'
  },
  {
    id: 'p15', type: 'done', size: 'card-sm', year: 2025,
    statusTag: 'status.exchange',
    title: 'VULCAN FESTIVAL',
    description: 'Visibilidade internacional e fortalecimento de rede de advocacy via Mídia Ninja.',
    territory: 'Brasil', axis: ['Arte', 'Direitos'],
    kpiLabel: null, kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.scope', value: 'Global Network' },
      { labelKey: 'project.connection', value: 'Vulcan Observatory' }
    ],
    category: 'climate', parentId: 'p5', connectionType: 'connections.relatedEvent'
  },
  {
    id: 'p16', type: 'done', size: 'card-md', year: 2025,
    statusTag: 'status.partnership',
    title: 'TRILHANDO CAMINHOS',
    description: 'Gestão administrativa rural, ervas e direitos sociais para mulheres na comunidade Cascata.',
    territory: 'Brasil', axis: ['Direitos', 'Água'],
    kpiLabel: 'labels.empowerment', kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.partners', value: 'Instituto Federal do Brasil' },
      { labelKey: 'project.role', value: 'Isadora (EG Poços de Caldas)' }
    ],
    category: 'rights', parentId: null, connectionType: null
  },
  {
    id: 'p16b', type: 'done', size: 'card-sm', year: 2025,
    statusTag: 'status.advisor',
    title: 'NANCI FERREIRA',
    description: 'Facilitadora idosa e ponte comunitária. Conselheira de Saberes do projeto EG Cascata.',
    territory: 'Brasil', axis: ['Direitos'],
    kpiLabel: 'labels.communityConnection', kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.role', value: 'Conselheira de Saberes' },
      { labelKey: 'project.connection', value: 'EG Cascata' }
    ],
    category: 'rights', parentId: 'p16', connectionType: 'connections.facilitator'
  },
  {
    id: 'p17', type: 'done', size: 'card-md', year: 2024,
    statusTag: 'status.partnership',
    title: 'BAQUE MULHER',
    description: 'Movimento de empoderamento feminino através do maracatu. Apresentações em eventos culturais.',
    territory: 'Brasil', axis: ['Arte', 'Direitos'],
    kpiLabel: 'labels.livingCulture', kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.type', value: 'Somente mulheres' },
      { labelKey: 'project.connection', value: 'Parceiro em eventos' }
    ],
    category: 'culture', parentId: null, connectionType: null
  },
  {
    id: 'p18', type: 'active', size: 'card-lg', year: 2025,
    statusTag: 'status.virada2026',
    title: 'SOS - HORTA PARQUE (SAF)',
    description: 'Sistema agroflorestal como laboratório vivo para projetos de restauração e educação ambiental.',
    territory: 'Brasil', axis: ['Água'],
    kpiLabel: 'Projetos Ativos', kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.type', value: 'SAF - Sistema Agroflorestal' },
      { labelKey: 'project.status', value: 'Base para projetos em execução' }
    ],
    category: 'restoration', parentId: null, connectionType: null
  },
  {
    id: 'p19', type: 'done', size: 'card-md', year: 2024,
    statusTag: 'status.creativeEconomy',
    title: 'PRATA PRINT / BHUMISPRINT',
    description: 'Economia criativa: produtos impressos originais (camisetas, canecas) e reuso de materiais.',
    territory: 'Brasil', axis: ['Arte'],
    kpiLabel: 'labels.sustainableFashion', kpiValue: null, kpiDetail: 'Camisetas, canecas, reuso',
    meta: [
      { labelKey: 'project.base', value: 'SOS Águas da Prata NGO' },
      { labelKey: 'project.focus', value: 'Redução impacto indústria fashion' }
    ],
    category: 'culture', parentId: null, connectionType: null
  },
  {
    id: 'p20', type: 'done', size: 'card-sm', year: 2024,
    statusTag: 'status.partnership',
    title: 'SOS - HORTA PARQUE (SAF)',
    description: 'Sistema agroflorestal como laboratório vivo para projetos de restauração e educação ambiental.',
    territory: 'Brasil', axis: ['Arte'],
    kpiLabel: null, kpiValue: null, kpiDetail: null,
    meta: [
      { labelKey: 'project.facilitators', value: 'RCC Tupã Levi, Crew Leader Isadora' },
      { labelKey: 'project.type', value: 'Educação Ambiental' }
    ],
    category: 'environmental', parentId: 'p16', connectionType: 'connections.educational'
  },
  {
    id: 'p21', type: 'done', size: 'card-sm', year: 2019,
    statusTag: 'status.founder',
    title: 'OFICINA DE MÚSICA',
    description: 'Projeto carro-chefe do coletivo - oficinas comunitárias gratuitas. Fundação da Banda Impermanente.',
    territory: 'Brasil', axis: ['Arte'],
    kpiLabel: 'labels.founderProject', kpiValue: null, kpiDetail: 'Base da Banda Impermanente',
    meta: [
      { labelKey: 'project.type', value: 'Projeto Formativo' },
      { labelKey: 'project.legacy', value: 'Workshops semanais' }
    ],
    category: 'culture', parentId: null, connectionType: null
  },
  {
    id: 'p21b', type: 'done', size: 'card-md', year: 2024,
    statusTag: 'status.professional',
    title: 'BANDA IMPERMANENTE',
    description: 'Projeto musical profissional nascido da Oficina de Música. Realiza apresentações e lançamentos.',
    territory: 'Brasil', axis: ['Arte'],
    kpiLabel: 'labels.professionalProject', kpiValue: null, kpiDetail: 'Álbuns e Apresentações',
    meta: [
      { labelKey: 'project.origin', value: 'Oficina de Música e Meio Ambiente' },
      { labelKey: 'project.base', value: 'SOS Águas da Prata' }
    ],
    category: 'culture', parentId: 'p21', connectionType: 'connections.evolution'
  },
  {
    id: 'p22', type: 'done', size: 'card-lg', year: 2025,
    statusTag: 'status.completed',
    title: 'O DESPERTAR DAS MATAS',
    description: 'Circo e teatro com temas socioambientais na escola pública EMEB Áurea Soares.',
    territory: 'Brasil', axis: ['Arte', 'Direitos'],
    kpiLabel: 'labels.fullCoverage', kpiValue: null, kpiDetail: 'COP30 + Todos os eventos',
    meta: [
      { labelKey: 'project.events', value: 'Virada Climática, COP30, Vulcan Festival' },
      { labelKey: 'project.format', value: 'Documentário, Fotos, Textos' }
    ],
    category: 'climate', parentId: null, connectionType: null
  }
]

// ─── ID mapping: old string IDs -> new UUIDs ────────────────────────────────
// We'll generate deterministic UUIDs or use Supabase-generated ones
// First pass: create all projects with gen_random_uuid(), then update parent_id

async function migrate() {
  console.log('=== MIGRATION START ===')
  console.log(`Total projects to migrate: ${projectsData.length}`)

  // Verification pass 1: check all fields are mapped
  console.log('\n--- VERIFICATION PASS 1: Field mapping ---')
  const requiredFields = ['id', 'type', 'size', 'title', 'description', 'territory', 'category']
  for (const p of projectsData) {
    for (const field of requiredFields) {
      if (!p[field]) {
        console.warn(`  WARNING: Project ${p.id} missing field: ${field}`)
      }
    }
  }
  console.log('  Field mapping check complete.')

  // Verification pass 2: check parent references are valid
  console.log('\n--- VERIFICATION PASS 2: Parent references ---')
  const allIds = new Set(projectsData.map(p => p.id))
  for (const p of projectsData) {
    if (p.parentId && !allIds.has(p.parentId)) {
      console.error(`  ERROR: Project ${p.id} references non-existent parent: ${p.parentId}`)
      process.exit(1)
    }
  }
  console.log('  All parent references valid.')

  // Phase 1: Insert all projects (without parent_id)
  console.log('\n--- PHASE 1: Inserting projects ---')
  const idMap = {} // old id -> new UUID

  // Insert root projects first (no parent), then children
  const roots = projectsData.filter(p => !p.parentId)
  const children = projectsData.filter(p => p.parentId)

  for (const p of roots) {
    const payload = {
      title: p.title,
      description: p.description,
      status: p.type,
      status_tag: p.statusTag,
      privacy: 'public', // Default to public for initial migration
      size: p.size,
      territory: p.territory,
      axis: p.axis || [],
      category: p.category,
      year: p.year,
      kpi_label: p.kpiLabel,
      kpi_value: p.kpiValue,
      kpi_detail: p.kpiDetail,
      meta: p.meta || [],
      links: p.links || [],
      connection_type: p.connectionType,
      position_x: 0,
      position_y: 0
    }

    console.log(`  Inserting: ${p.id} -> ${p.title}`)
    const { data, error } = await supabase.from('projects').insert(payload).select('id').single()

    if (error) {
      console.error(`  ERROR inserting ${p.id}:`, error.message)
      continue
    }

    idMap[p.id] = data.id
    console.log(`  OK: ${p.id} -> ${data.id}`)
  }

  // Phase 2: Insert children with parent_id
  console.log('\n--- PHASE 2: Inserting child projects ---')
  for (const p of children) {
    const parentUuid = idMap[p.parentId]
    if (!parentUuid) {
      console.error(`  ERROR: No UUID found for parent ${p.parentId} of project ${p.id}`)
      continue
    }

    const payload = {
      title: p.title,
      description: p.description,
      status: p.type,
      status_tag: p.statusTag,
      privacy: 'public',
      size: p.size,
      territory: p.territory,
      axis: p.axis || [],
      category: p.category,
      year: p.year,
      parent_id: parentUuid,
      kpi_label: p.kpiLabel,
      kpi_value: p.kpiValue,
      kpi_detail: p.kpiDetail,
      meta: p.meta || [],
      links: p.links || [],
      connection_type: p.connectionType,
      position_x: 0,
      position_y: 0
    }

    console.log(`  Inserting: ${p.id} -> ${p.title} (parent: ${p.parentId} -> ${parentUuid})`)
    const { data, error } = await supabase.from('projects').insert(payload).select('id').single()

    if (error) {
      console.error(`  ERROR inserting ${p.id}:`, error.message)
      continue
    }

    idMap[p.id] = data.id
    console.log(`  OK: ${p.id} -> ${data.id}`)
  }

  // Verification: count records
  console.log('\n--- FINAL VERIFICATION ---')
  const { count, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error counting:', countError.message)
  } else {
    console.log(`  Total records in DB: ${count}`)
    console.log(`  Expected: ${projectsData.length}`)
    console.log(`  Match: ${count === projectsData.length ? 'YES' : 'NO - CHECK ERRORS ABOVE'}`)
  }

  // Sample verification
  const { data: sample } = await supabase
    .from('projects')
    .select('id, title, status, parent_id')
    .limit(5)

  console.log('\n  Sample records:')
  sample?.forEach(r => {
    console.log(`    ${r.title} [${r.status}] parent: ${r.parent_id || 'none'}`)
  })

  console.log('\n=== MIGRATION COMPLETE ===')
  console.log('ID Mapping:')
  Object.entries(idMap).forEach(([old, newId]) => {
    console.log(`  ${old} -> ${newId}`)
  })
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
