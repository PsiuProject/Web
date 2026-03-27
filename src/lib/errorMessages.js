/**
 * Localized Error Messages
 * Centralized error message definitions for multi-language support
 */

export const errorMessages = {
  // Font upload errors
  fontUpload: {
    fileSizeExceeded: {
      pt: 'O tamanho do arquivo excede o limite de 5MB. Tamanho atual: {size}MB',
      en: 'File size exceeds 5MB limit. Current size: {size}MB'
    },
    invalidFileType: {
      pt: 'Arquivo de fonte inválido. Por favor, envie arquivos .ttf, .otf, .woff ou .woff2.',
      en: 'Invalid font file. Please upload .ttf, .otf, .woff, or .woff2 files.'
    },
    uploadFailed: {
      pt: 'Falha ao salvar arquivo de fonte. Por favor, tente novamente.',
      en: 'Failed to save font file. Please try again.'
    },
    loadFailed: {
      pt: 'Falha ao carregar arquivo de fonte. Por favor, certifique-se de que é um arquivo .ttf, .otf, .woff ou .woff2 válido.',
      en: "Failed to load font file. Please ensure it's a valid .ttf, .otf, .woff, or .woff2 file."
    }
  },

  // Element creation/update errors
  element: {
    createFailed: {
      pt: 'Falha ao criar elemento. Por favor, tente novamente.',
      en: 'Failed to create element. Please try again.'
    },
    updateFailed: {
      pt: 'Falha ao atualizar elemento. Por favor, tente novamente.',
      en: 'Failed to update element. Please try again.'
    },
    deleteFailed: {
      pt: 'Falha ao excluir elemento. Por favor, tente novamente.',
      en: 'Failed to delete element. Please try again.'
    },
    contentUpdateFailed: {
      pt: 'Falha ao atualizar conteúdo do elemento',
      en: 'Failed to update element content'
    }
  },

  // Connection errors
  connection: {
    createFailed: {
      pt: 'Falha ao criar conexão. Por favor, tente novamente.',
      en: 'Failed to create connection. Please try again.'
    },
    updateFailed: {
      pt: 'Falha ao atualizar conexão. Por favor, tente novamente.',
      en: 'Failed to update connection. Please try again.'
    },
    deleteFailed: {
      pt: 'Falha ao excluir conexão. Por favor, tente novamente.',
      en: 'Failed to delete connection. Please try again.'
    },
    invalidElement: {
      pt: 'Elemento de conexão inválido ou não encontrado',
      en: 'Invalid or missing connection element'
    }
  },

  // Comment errors
  comment: {
    addFailed: {
      pt: 'Falha ao adicionar comentário. Por favor, tente novamente.',
      en: 'Failed to add comment. Please try again.'
    },
    updateFailed: {
      pt: 'Falha ao atualizar comentário. Por favor, tente novamente.',
      en: 'Failed to update comment. Please try again.'
    },
    deleteFailed: {
      pt: 'Falha ao excluir comentário. Por favor, tente novamente.',
      en: 'Failed to delete comment. Please try again.'
    }
  },

  // General errors
  general: {
    networkError: {
      pt: 'Erro de rede. Por favor, verifique sua conexão.',
      en: 'Network error. Please check your connection.'
    },
    unauthorized: {
      pt: 'Não autorizado. Por favor, faça login novamente.',
      en: 'Unauthorized. Please log in again.'
    },
    serverError: {
      pt: 'Erro do servidor. Por favor, tente novamente mais tarde.',
      en: 'Server error. Please try again later.'
    },
    confirmation: {
      deleteElement: {
        pt: 'Excluir este elemento?',
        en: 'Delete this element?'
      },
      deleteCard: {
        pt: 'Excluir este card?',
        en: 'Delete this card?'
      },
      clearAll: {
        pt: 'Tem certeza de que deseja limpar todos os elementos?',
        en: 'Are you sure you want to clear all elements?'
      }
    }
  }
}

/**
 * Get localized error message
 * @param {string} category - Error category (fontUpload, element, connection, etc.)
 * @param {string} key - Error key within category
 * @param {string} locale - Locale code ('pt' or 'en')
 * @param {object} params - Optional parameters for template replacement
 * @returns {string} Localized error message
 */
export function getErrorMessage(category, key, locale = 'pt', params = {}) {
  const categoryMessages = errorMessages[category]
  if (!categoryMessages) {
    console.warn(`[errorMessages] Unknown category: ${category}`)
    return `Error: ${key}`
  }

  const messageObj = categoryMessages[key]
  if (!messageObj) {
    console.warn(`[errorMessages] Unknown key: ${key} in category ${category}`)
    return `Error: ${category}.${key}`
  }

  let message = messageObj[locale] || messageObj.pt || messageObj.en || ''

  // Replace template parameters
  if (params && typeof message === 'string') {
    Object.keys(params).forEach((paramKey) => {
      message = message.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey])
    })
  }

  return message
}
