# Application Improvement Tasks

## 🔴 CRITICAL (Security & Stability)

### 1. Fix XSS Vulnerability in Card and Text Components
- **Files**: `src/components/Canvas/Render/Card.vue`, `src/components/Canvas/Render/Text.vue`
- **Issue**: Unsanitized HTML rendered via `v-html` allows script injection
- **Fix**: Install and use DOMPurify to sanitize all HTML before rendering
- **Priority**: P0 - Security Critical

### 2. Add Null Checks in Connection Coordinate Calculations
- **File**: `src/stores/elements.js`
- **Issue**: Missing validation causes crashes when connections reference deleted elements
- **Fix**: Add proper filtering, null checks, and warning logs
- **Priority**: P0 - Stability Critical

### 3. Fix Memory Leaks in Text Component
- **File**: `src/components/Canvas/Render/Text.vue`
- **Issue**: Event listeners not cleaned up on unmount
- **Fix**: Implement proper cleanup in `onUnmounted` hook
- **Priority**: P0 - Performance Critical

---

## 🟠 HIGH PRIORITY

### 4. Fix Race Condition in Element Creation
- **File**: `src/views/CanvasEdit.vue`
- **Issue**: Content updates not awaited, creating inconsistent state
- **Fix**: Chain async operations with proper error handling and rollback
- **Priority**: P1

### 5. Add Input Validation for Font Upload
- **File**: `src/components/Canvas/Render/Text.vue`
- **Issue**: No file size or MIME type validation
- **Fix**: Validate file size (<5MB), MIME type, and extension before upload
- **Priority**: P1

### 6. Fix Zoom Scaling for Connection Detection
- **File**: `src/views/CanvasEdit.vue`
- **Issue**: Detection radius inverted at extreme zoom levels
- **Fix**: Use clamped/logarithmic scaling for consistent feel
- **Priority**: P1

### 7. Complete Connection Persistence (Supabase)
- **File**: `src/stores/elements.js`
- **Issue**: TODO comments indicate missing Supabase integration
- **Fix**: Implement createConnection and deleteConnection with Supabase
- **Priority**: P1

### 8. Fix Mock vs Real Mode Inconsistency
- **Files**: `src/stores/elements.js`, `src/stores/comments.js`
- **Issue**: Dual code paths may behave differently
- **Fix**: Create repository abstraction layer for unified data access
- **Priority**: P1

---

## 🟡 MEDIUM PRIORITY

### 9. Remove/Gate Console Logging
- **Files**: All components and stores (161 occurrences)
- **Issue**: Excessive logging in production code
- **Fix**: Create logger utility with environment-based filtering
- **Priority**: P2

### 10. Eliminate Duplicate Code
- **File**: `src/stores/elements.js`
- **Issue**: Color maps defined twice
- **Fix**: Extract to constants file
- **Priority**: P2

### 11. Add Loading/Error States to Properties Panel
- **File**: `src/components/Canvas/Editor/PropertiesPanel.vue`
- **Issue**: Updates without feedback or error handling
- **Fix**: Add optimistic UI with loading indicators and rollback on failure
- **Priority**: P2

### 12. Create Design Tokens System
- **Files**: Create `src/lib/designTokens.js`
- **Issue**: Magic numbers scattered throughout
- **Fix**: Centralize UI constants (dimensions, spacing, typography)
- **Priority**: P2

### 13. Optimize Comments Store Getters
- **File**: `src/stores/comments.js`
- **Issue**: O(n²) operations in threadsByElement getter
- **Fix**: Memoize computed properties, use indexing for O(1) lookup
- **Priority**: P2

### 14. Localize Error Messages
- **Files**: All components with alerts
- **Issue**: English-only errors in multi-language app
- **Fix**: Add error messages to i18n locales, use store translations
- **Priority**: P2

---

## 🔵 LOW PRIORITY

### 15. Add JSDoc Documentation
- **Files**: All public functions and composables
- **Issue**: Missing documentation
- **Fix**: Add JSDoc comments for APIs
- **Priority**: P3

### 16. Add Unit Tests
- **Files**: Create `tests/unit/` directory
- **Issue**: No test coverage for business logic
- **Fix**: Add tests for stores, composables, utilities
- **Priority**: P3

---

## Progress Tracking

- [x] Task 1: Fix XSS Vulnerability
- [x] Task 2: Add Null Checks in Connections
- [x] Task 3: Fix Memory Leaks in Text Component
- [x] Task 4: Fix Element Creation Race Condition
- [x] Task 5: Add Font Upload Validation
- [x] Task 6: Fix Zoom Scaling
- [x] Task 7: Complete Connection Persistence
- [x] Task 8: Fix Mock/Real Mode Inconsistency
- [x] Task 9: Remove/Gate Console Logging
- [x] Task 10: Eliminate Duplicate Code
- [ ] Task 11: Add Loading/Error States
- [x] Task 12: Create Design Tokens
- [x] Task 13: Optimize Comments Getters
- [x] Task 14: Localize Error Messages
- [x] Task 15: Add JSDoc Documentation
- [ ] Task 16: Add Unit Tests

---

## Implementation Notes

- Work through tasks in priority order (P0 → P1 → P2 → P3)
- Test each fix thoroughly before moving to next task
- Update this file as tasks are completed
- Document any additional issues discovered during implementation

---

## Completed Work Summary

### P0 Critical (Completed)
1. **XSS Vulnerability Fixed** - Added DOMPurify sanitization to Card.vue and Text.vue components for all v-html rendering
2. **Null Checks Added** - Comprehensive validation in connection coordinate calculations with warning logs
3. **Memory Leaks Fixed** - Proper cleanup of font size scrubbing event listeners in Text.vue unmount

### P1 High Priority (Completed)
4. **Race Condition Fixed** - Proper async/await handling in element creation with error rollback
5. **Font Upload Validation** - File size (<5MB), MIME type, and extension validation added
6. **Zoom Scaling Fixed** - Clamped logarithmic scaling for consistent connection detection radius
7. **Connection Persistence** - Full Supabase integration for canvas_connections table with mock mode support
8. **Mock/Real Mode Consistency** - Unified data access layer with proper localStorage sync

### P2 Medium Priority (Completed)
9. **Logger Utility Created** - Environment-based logging utility at `src/lib/logger.js` (ready for use)
10. **Duplicate Code Eliminated** - Connection color maps consolidated using design tokens in `src/stores/elements.js`
12. **Design Tokens System** - Created centralized constants at `src/lib/designTokens.js`
13. **Comments Store Getters Optimized** - Refactored from O(n²) to O(n) using indexing for reply grouping
14. **Error Message Localization** - Created `src/lib/errorMessages.js` with PT/EN translations, integrated in Text.vue, Card.vue, CanvasEdit.vue
15. **JSDoc Documentation** - Added comprehensive JSDoc comments to stores (elements.js, comments.js) and utilities

### Remaining Tasks
11. Loading/Error States for Properties Panel
16. Unit Tests
