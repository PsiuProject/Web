// Connection types configuration
export const CONNECTION_TYPES = [
  { 
    name: 'subProject', 
    label_key: 'connections.subProject', 
    color: '#ff5f1f',
    stroke_pattern: 'solid',
    arrow_style: 'arrow'
  },
  { 
    name: 'related', 
    label_key: 'connections.related', 
    color: '#6a7d5b',
    stroke_pattern: 'dashed',
    arrow_style: 'none'
  },
  { 
    name: 'inspiration', 
    label_key: 'connections.inspiration', 
    color: '#b55d3a',
    stroke_pattern: 'solid',
    arrow_style: 'arrow'
  },
  { 
    name: 'evolution', 
    label_key: 'connections.evolution', 
    color: '#508cdc',
    stroke_pattern: 'solid',
    arrow_style: 'arrow'
  },
  { 
    name: 'dependency', 
    label_key: 'connections.dependency', 
    color: '#9b59b6',
    stroke_pattern: 'dotted',
    arrow_style: 'arrow'
  },
  { 
    name: 'reference', 
    label_key: 'connections.reference', 
    color: '#95a5a6',
    stroke_pattern: 'dashed',
    arrow_style: 'none'
  }
]

export function getConnectionType(name) {
  return CONNECTION_TYPES.find(ct => ct.name === name)
}

export function getConnectionColor(name) {
  const type = getConnectionType(name)
  return type?.color || '#b55d3a'
}

export function getStrokePattern(type) {
  const patterns = {
    solid: 'none',
    dashed: '10,5',
    dotted: '3,3'
  }
  const connType = getConnectionType(type)
  return patterns[connType?.stroke_pattern || 'solid']
}

export function hasArrow(type) {
  const connType = getConnectionType(type)
  return connType?.arrow_style === 'arrow'
}
