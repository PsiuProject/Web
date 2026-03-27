// Mock data for offline/dev mode testing
// Includes projects, canvas elements, and comments

export const MOCK_USER = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  user_metadata: {
    full_name: 'Dev User',
    avatar_url: null
  }
}

export const TEST_PROJECTS = [
  {
    id: 'test-project-1',
    owner_id: 'dev-user-123',
    title: { pt: 'Projeto Teste', en: 'Test Project' },
    description: {
      pt: 'Projeto de teste para desenvolvimento offline',
      en: 'Offline development test project'
    },
    status: 'active',
    privacy: 'private',
    size: 'card-md',
    territory: 'Brasil',
    axis: ['Inovação', 'Sustentabilidade'],
    category: 'test',
    year: 2026,
    position_x: 100,
    position_y: 150,
    kpi_label: { pt: 'Impacto', en: 'Impact' },
    kpi_value: '85%',
    kpi_detail: { pt: 'Alto', en: 'High' },
    meta: [
      { labelKey: 'meta.budget', value: 'R$ 500k' },
      { labelKey: 'meta.team', value: '8 pessoas' }
    ],
    links: [{ url: 'https://example.com', type: 'website' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-project-2',
    owner_id: 'dev-user-123',
    title: { pt: 'Projeto Pipeline', en: 'Pipeline Project' },
    description: { pt: 'Projeto em fase de escrita', en: 'Project in writing phase' },
    status: 'pipeline',
    privacy: 'private',
    size: 'card-sm',
    territory: 'Argentina',
    axis: ['Educação'],
    category: 'test',
    year: 2026,
    position_x: 450,
    position_y: 200,
    kpi_label: { pt: 'Progresso', en: 'Progress' },
    kpi_value: '30%',
    kpi_detail: { pt: 'Em andamento', en: 'In progress' },
    meta: [{ labelKey: 'meta.deadline', value: 'Dez 2026' }],
    links: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'test-project-3',
    owner_id: 'dev-user-123',
    title: { pt: 'Projeto Concluído', en: 'Completed Project' },
    description: { pt: 'Projeto já finalizado', en: 'Already completed project' },
    status: 'done',
    privacy: 'public',
    size: 'card-lg',
    territory: 'Chile',
    axis: ['Tecnologia', 'Meio Ambiente'],
    category: 'test',
    year: 2025,
    position_x: 800,
    position_y: 100,
    kpi_label: { pt: 'Resultado', en: 'Result' },
    kpi_value: '100%',
    kpi_detail: { pt: 'Entregue', en: 'Delivered' },
    meta: [
      { labelKey: 'meta.completed', value: 'Jan 2026' },
      { labelKey: 'meta.impact', value: '1000 pessoas' }
    ],
    links: [
      { url: 'https://example.com/result', type: 'website' },
      { url: 'https://youtube.com/watch?v=test', type: 'video' }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Pre-populated canvas elements for test project
export const TEST_CANVAS_ELEMENTS = [
  {
    id: 'elem-card-1',
    project_id: 'test-project-1',
    type: 'card',
    content: {
      title: { pt: 'Card Exemplo', en: 'Example Card' },
      description: {
        pt: 'Este é um card de exemplo no canvas',
        en: 'This is an example card on the canvas'
      },
      status: 'active'
    },
    position_x: 150,
    position_y: 200,
    width: 280,
    height: 370,
    rotation: 0,
    z_index: 1,
    style: {
      background: '#141412',
      borderColor: '#3e4c33'
    },
    created_by: 'dev-user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'elem-text-1',
    project_id: 'test-project-1',
    type: 'text',
    content: {
      text: { pt: 'Texto de boas-vindas ao projeto!', en: 'Welcome text to the project!' },
      boxed: false
    },
    position_x: 500,
    position_y: 150,
    width: 300,
    height: 60,
    rotation: 0,
    z_index: 2,
    font_size: 18,
    text_color: '#e2ded0',
    style: {},
    created_by: 'dev-user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'elem-image-1',
    project_id: 'test-project-1',
    type: 'image',
    content: {
      url: '',
      caption: {
        pt: 'Imagem de exemplo (upload para adicionar)',
        en: 'Example image (upload to add)'
      }
    },
    position_x: 500,
    position_y: 250,
    width: 200,
    height: 150,
    rotation: 0,
    z_index: 3,
    style: {},
    created_by: 'dev-user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'elem-link-1',
    project_id: 'test-project-1',
    type: 'link',
    content: {
      url: 'https://earthguardians.sur',
      label: { pt: 'Visite nosso site', en: 'Visit our website' }
    },
    position_x: 500,
    position_y: 450,
    width: 200,
    height: 44,
    rotation: 0,
    z_index: 4,
    style: {},
    created_by: 'dev-user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'elem-button-1',
    project_id: 'test-project-1',
    type: 'button',
    content: {
      url: 'https://example.com/action',
      label: { pt: 'Ação Importante', en: 'Important Action' }
    },
    position_x: 720,
    position_y: 450,
    width: 180,
    height: 44,
    rotation: 0,
    z_index: 5,
    style: {
      background: '#b55d3a',
      color: '#ffffff'
    },
    created_by: 'dev-user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Pre-populated comments for test project
export const TEST_COMMENTS = [
  {
    id: 'comment-1',
    project_id: 'test-project-1',
    element_id: 'elem-card-1',
    parent_comment_id: null,
    user_id: 'dev-user-123',
    content: 'Este card está ótimo! Vamos adicionar mais detalhes?',
    resolved: false,
    attachment_type: null,
    attachment_url: null,
    position_x: 440,
    position_y: 200,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updated_at: new Date().toISOString(),
    user: MOCK_USER
  },
  {
    id: 'comment-2',
    project_id: 'test-project-1',
    element_id: 'elem-card-1',
    parent_comment_id: 'comment-1',
    user_id: 'dev-user-123',
    content: 'Boa ideia! Vou adicionar o KPI atualizado.',
    resolved: false,
    attachment_type: null,
    attachment_url: null,
    position_x: 440,
    position_y: 200,
    created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    updated_at: new Date().toISOString(),
    user: MOCK_USER
  },
  {
    id: 'comment-3',
    project_id: 'test-project-1',
    element_id: null,
    parent_comment_id: null,
    user_id: 'dev-user-123',
    content: 'Lembrete: atualizar as cores do tema na próxima sprint',
    resolved: true,
    attachment_type: null,
    attachment_url: null,
    position_x: 50,
    position_y: 50,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
    user: MOCK_USER
  }
]

// Pre-populated connections for test project
export const TEST_CONNECTIONS = [
  {
    id: 'conn-1',
    project_id: 'test-project-1',
    source_element_id: 'elem-text-1',
    target_element_id: 'elem-card-1',
    source_side: 'bottom',
    target_side: 'top',
    connection_type: 'subProject',
    color: '#b55d3a',
    created_by: 'dev-user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Helper functions for localStorage management
export class MockDataStore {
  constructor() {
    this.prefix = 'mock-data-'
  }

  // Projects
  getProjects() {
    const data = localStorage.getItem(this.prefix + 'projects')
    const result = data ? JSON.parse(data) : TEST_PROJECTS
    console.log('[MockData] getProjects called, returning:', result.length, 'projects')
    console.log(
      '[MockData] projects:',
      result.map((p) => ({ id: p.id, title: p.title, owner_id: p.owner_id, status: p.status }))
    )
    return result
  }

  saveProjects(projects) {
    console.log('[MockData] saveProjects called with:', projects.length, 'projects')
    localStorage.setItem(this.prefix + 'projects', JSON.stringify(projects))
  }

  // Canvas Elements
  getElements(projectId) {
    const all = localStorage.getItem(this.prefix + 'elements')
    const data = all ? JSON.parse(all) : TEST_CANVAS_ELEMENTS
    return data.filter((el) => el.project_id === projectId)
  }

  saveElements(elements) {
    localStorage.setItem(this.prefix + 'elements', JSON.stringify(elements))
  }

  addElement(element) {
    const elements = this.getElements(element.project_id)
    elements.push(element)
    this.saveElements(elements)
  }

  updateElement(id, updates) {
    const all = this.getAllElements()
    const idx = all.findIndex((el) => el.id === id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() }
      this.saveElements(all)
      return all[idx]
    }
    return null
  }

  deleteElement(id) {
    const all = this.getAllElements()
    const filtered = all.filter((el) => el.id !== id)
    this.saveElements(filtered)
  }

  getAllElements() {
    const data = localStorage.getItem(this.prefix + 'elements')
    return data ? JSON.parse(data) : TEST_CANVAS_ELEMENTS
  }

  // Comments
  getComments(projectId) {
    const data = localStorage.getItem(this.prefix + 'comments')
    const all = data ? JSON.parse(data) : TEST_COMMENTS
    return all.filter((c) => c.project_id === projectId)
  }

  saveComments(comments) {
    localStorage.setItem(this.prefix + 'comments', JSON.stringify(comments))
  }

  addComment(comment) {
    const all = this.getAllComments()
    const newComment = {
      ...comment,
      id: 'comment-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: MOCK_USER
    }
    all.push(newComment)
    this.saveComments(all)
    return newComment
  }

  updateComment(id, updates) {
    const all = this.getAllComments()
    const idx = all.findIndex((c) => c.id === id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() }
      this.saveComments(all)
      return all[idx]
    }
    return null
  }

  deleteComment(id) {
    const all = this.getAllComments()
    const filtered = all.filter((c) => c.id !== id && c.parent_comment_id !== id)
    this.saveComments(filtered)
  }

  getAllComments() {
    const data = localStorage.getItem(this.prefix + 'comments')
    return data ? JSON.parse(data) : TEST_COMMENTS
  }

  // Connections
  getConnections(projectId) {
    const data = localStorage.getItem(this.prefix + 'connections')
    const all = data ? JSON.parse(data) : TEST_CONNECTIONS
    return all.filter((c) => c.project_id === projectId)
  }

  saveConnections(connections) {
    localStorage.setItem(this.prefix + 'connections', JSON.stringify(connections))
  }

  addConnection(connection) {
    const all = this.getAllConnections()
    all.push(connection)
    this.saveConnections(all)
  }

  updateConnection(id, updates) {
    const all = this.getAllConnections()
    const idx = all.findIndex((c) => c.id === id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() }
      this.saveConnections(all)
      return all[idx]
    }
    return null
  }

  deleteConnection(id) {
    const all = this.getAllConnections()
    const filtered = all.filter((c) => c.id !== id)
    this.saveConnections(filtered)
  }

  getAllConnections() {
    const data = localStorage.getItem(this.prefix + 'connections')
    return data ? JSON.parse(data) : TEST_CONNECTIONS
  }

  // Notifications
  getNotifications() {
    const data = localStorage.getItem(this.prefix + 'notifications')
    return data ? JSON.parse(data) : []
  }

  addNotification(notif) {
    const all = this.getNotifications()
    all.unshift({
      ...notif,
      id: 'notif-' + Date.now(),
      created_at: new Date().toISOString()
    })
    localStorage.setItem(this.prefix + 'notifications', JSON.stringify(all))
  }

  markNotificationRead(id) {
    const all = this.getNotifications()
    const idx = all.findIndex((n) => n.id === id)
    if (idx >= 0) {
      all[idx].read = true
      localStorage.setItem(this.prefix + 'notifications', JSON.stringify(all))
    }
  }

  // Clear all mock data
  clear() {
    localStorage.removeItem(this.prefix + 'projects')
    localStorage.removeItem(this.prefix + 'elements')
    localStorage.removeItem(this.prefix + 'comments')
    localStorage.removeItem(this.prefix + 'connections')
    localStorage.removeItem(this.prefix + 'notifications')
  }

  // Reset to initial state
  reset() {
    this.clear()
    this.saveProjects(TEST_PROJECTS)
    this.saveElements(TEST_CANVAS_ELEMENTS)
    this.saveComments(TEST_COMMENTS)
    this.saveConnections(TEST_CONNECTIONS)
  }
}

export const mockStore = new MockDataStore()
