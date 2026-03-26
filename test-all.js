/**
 * COMPREHENSIVE GALLERY TEST SUITE
 * Automated testing for Supabase and Dev Mode
 * 
 * Run in browser console on any page:
 * await import('./test-all.js')
 */

import { useAuthStore } from './src/stores/auth.js';
import { useProjectsStore } from './src/stores/projectsStore.js';
import { useGalleryStore } from './src/stores/gallery.js';
import { mockStore } from './src/lib/mockData.js';

class ComprehensiveTestSuite {
  constructor() {
    this.results = {};
    this.logs = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, type, message };
    this.logs.push(entry);
    
    const icon = type === 'error' ? '🔴' : type === 'warn' ? '🟡' : '✅';
    console.log(`${icon} [${timestamp}] ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Environment Check
  async testEnvironment() {
    this.log('=== ENVIRONMENT CHECK ===', 'info');
    
    try {
      const env = {
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        baseUrl: import.meta.env.BASE_URL,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'NOT SET',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET'
      };
      
      this.results.environment = env;
      this.log(`Environment: ${env.isDev ? 'DEV' : 'PRODUCTION'}`, 'info');
      this.log(`Base URL: ${env.baseUrl}`, 'info');
      this.log(`Supabase URL: ${env.supabaseUrl === 'NOT SET' ? '❌ Not configured' : '✓ Configured'}`, env.supabaseUrl === 'NOT SET' ? 'warn' : 'info');
      
      return true;
    } catch (e) {
      this.log(`Environment check failed: ${e.message}`, 'error');
      this.results.environment = { error: e.message };
      return false;
    }
  }

  // Test 2: Authentication (Both Modes)
  async testAuthentication() {
    this.log('=== AUTHENTICATION TEST ===', 'info');
    
    try {
      const auth = useAuthStore();
      
      // Initialize auth
      this.log('Initializing auth...', 'info');
      await auth.init();
      await this.sleep(500);
      
      // Check initial state
      this.log(`Initial state - Logged in: ${auth.isLoggedIn}, User ID: ${auth.userId}`, 'info');
      
      // Try dev mode login
      if (!auth.isLoggedIn) {
        this.log('Attempting dev mode login...', 'info');
        auth.checkDevMode();
        this.log(`Is Dev Mode: ${auth.isDevMode}`, 'info');
        
        if (auth.isDevMode) {
          const loginResult = await auth.loginWithGoogle();
          this.log(`Dev mode login result: ${loginResult}`, loginResult ? 'info' : 'error');
          await this.sleep(500);
        }
      }
      
      this.results.auth = {
        isLoggedIn: auth.isLoggedIn,
        userId: auth.userId,
        userEmail: auth.userEmail,
        isDevMode: auth.isDevMode,
        isOfflineDev: auth.isOfflineDev,
        userName: auth.userName
      };
      
      this.log(`Auth complete - Logged in: ${auth.isLoggedIn}, User ID: ${auth.userId}`, auth.isLoggedIn ? 'info' : 'error');
      
      return auth.isLoggedIn;
    } catch (e) {
      this.log(`Auth test failed: ${e.message}`, 'error');
      this.results.auth = { error: e.message, stack: e.stack };
      return false;
    }
  }

  // Test 3: Mock Data System
  async testMockData() {
    this.log('=== MOCK DATA TEST ===', 'info');
    
    try {
      // Check localStorage
      const storedProjects = localStorage.getItem('mock-data-projects');
      this.log(`Stored projects: ${storedProjects ? 'Found' : 'Not found'}`, storedProjects ? 'info' : 'warn');
      
      if (!storedProjects) {
        this.log('Resetting mock data...', 'info');
        mockStore.reset();
        await this.sleep(300);
      }
      
      // Get mock projects
      const mockProjects = mockStore.getProjects();
      this.log(`Mock projects count: ${mockProjects.length}`, 'info');
      this.log(`Mock projects: ${JSON.stringify(mockProjects.map(p => ({ id: p.id, title: typeof p.title === 'object' ? p.title.pt : p.title, status: p.status })), null, 2)}`, 'info');
      
      this.results.mockData = {
        stored: !!storedProjects,
        count: mockProjects.length,
        projects: mockProjects.map(p => ({
          id: p.id,
          title: typeof p.title === 'object' ? p.title : { pt: p.title },
          status: p.status,
          owner_id: p.owner_id
        }))
      };
      
      return mockProjects.length > 0;
    } catch (e) {
      this.log(`Mock data test failed: ${e.message}`, 'error');
      this.results.mockData = { error: e.message };
      return false;
    }
  }

  // Test 4: Project Loading (Dev Mode)
  async testProjectLoadingDev() {
    this.log('=== PROJECT LOADING (DEV MODE) ===', 'info');
    
    try {
      const projectsStore = useProjectsStore();
      
      // Clear existing
      projectsStore.projects = [];
      
      // Load in dev mode
      this.log('Loading projects...', 'info');
      await projectsStore.loadProjects();
      await this.sleep(500);
      
      this.log(`Loaded: ${projectsStore.projects.length} projects`, 'info');
      this.log(`Is Supabase Loaded: ${projectsStore.isSupabaseLoaded}`, 'info');
      this.log(`Is Offline Dev: ${projectsStore.isOfflineDev}`, 'info');
      
      this.results.projectsDev = {
        count: projectsStore.projects.length,
        isSupabaseLoaded: projectsStore.isSupabaseLoaded,
        isOfflineDev: projectsStore.isOfflineDev,
        projects: projectsStore.projects.map(p => ({
          id: p.id,
          title: typeof p.title === 'object' ? p.title : { pt: p.title },
          status: p.status,
          owner_id: p.owner_id
        }))
      };
      
      return projectsStore.projects.length > 0;
    } catch (e) {
      this.log(`Project loading (dev) failed: ${e.message}`, 'error');
      this.results.projectsDev = { error: e.message };
      return false;
    }
  }

  // Test 5: Gallery Format Conversion
  async testGalleryFormat() {
    this.log('=== GALLERY FORMAT CONVERSION ===', 'info');
    
    try {
      const galleryStore = useGalleryStore();
      const projects = galleryStore.projects;
      
      this.log(`Gallery projects count: ${projects.length}`, 'info');
      
      this.results.galleryFormat = {
        count: projects.length,
        projects: projects.map(p => ({
          id: p.id,
          title: p.titleKey,
          type: p.type,
          owner_id: p.owner_id,
          parentId: p.parentId
        }))
      };
      
      return projects.length > 0;
    } catch (e) {
      this.log(`Gallery format test failed: ${e.message}`, 'error');
      this.results.galleryFormat = { error: e.message };
      return false;
    }
  }

  // Test 6: Filters
  async testFilters() {
    this.log('=== FILTERS TEST ===', 'info');
    
    try {
      const galleryStore = useGalleryStore();
      
      this.log(`Active filters before clear:`, 'info');
      this.log(`- activeFilter: ${galleryStore.activeFilter}`, 'info');
      this.log(`- focusedType: ${galleryStore.focusedType}`, 'info');
      this.log(`- activeAxisFilter: ${galleryStore.activeAxisFilter}`, 'info');
      this.log(`- activeCategoryFilter: ${galleryStore.activeCategoryFilter}`, 'info');
      this.log(`- activeYearFilter: ${galleryStore.activeYearFilter}`, 'info');
      
      // Clear all filters
      galleryStore.activeFilter = 'todos';
      galleryStore.focusedType = null;
      galleryStore.activeAxisFilter = null;
      galleryStore.activeCategoryFilter = null;
      galleryStore.activeYearFilter = null;
      
      this.log('All filters cleared', 'info');
      
      const filtered = galleryStore.filteredProjects;
      this.log(`Filtered projects count: ${filtered.length}`, 'info');
      
      this.results.filters = {
        count: filtered.length,
        activeFilters: {
          activeFilter: galleryStore.activeFilter,
          focusedType: galleryStore.focusedType,
          activeAxisFilter: galleryStore.activeAxisFilter,
          activeCategoryFilter: galleryStore.activeCategoryFilter,
          activeYearFilter: galleryStore.activeYearFilter
        },
        projects: filtered.map(p => ({
          id: p.id,
          title: p.titleKey,
          type: p.type,
          parentId: p.parentId
        }))
      };
      
      return filtered.length > 0;
    } catch (e) {
      this.log(`Filters test failed: ${e.message}`, 'error');
      this.results.filters = { error: e.message };
      return false;
    }
  }

  // Test 7: Root Projects
  async testRootProjects() {
    this.log('=== ROOT PROJECTS TEST ===', 'info');
    
    try {
      const galleryStore = useGalleryStore();
      const root = galleryStore.filteredProjects.filter(p => !p.parentId);
      
      this.log(`Root projects count: ${root.length}`, 'info');
      this.log(`Root projects: ${JSON.stringify(root.map(p => ({ id: p.id, title: p.titleKey, type: p.type })), null, 2)}`, 'info');
      
      this.results.root = {
        count: root.length,
        projects: root.map(p => ({
          id: p.id,
          title: p.titleKey,
          type: p.type
        }))
      };
      
      return root.length > 0;
    } catch (e) {
      this.log(`Root projects test failed: ${e.message}`, 'error');
      this.results.root = { error: e.message };
      return false;
    }
  }

  // Test 8: Layout Calculation
  async testLayout() {
    this.log('=== LAYOUT CALCULATION TEST ===', 'info');
    
    try {
      const galleryStore = useGalleryStore();
      const root = galleryStore.filteredProjects.filter(p => !p.parentId);
      const layouted = galleryStore.layoutOwnedProjects(root);
      
      this.log(`Layouted projects count: ${layouted.length}`, 'info');
      this.log(`Layouted projects: ${JSON.stringify(layouted.map(p => ({ 
        id: p.id, 
        title: p.titleKey, 
        type: p.type,
        position: p.computedPosition 
      }), null, 2)}`, 'info');
      
      // Check sections
      const sections = {
        active: layouted.filter(p => p.type === 'active').length,
        pipeline: layouted.filter(p => p.type === 'pipeline').length,
        done: layouted.filter(p => p.type === 'done').length
      };
      
      this.log(`Sections: ${JSON.stringify(sections)}`, 'info');
      
      this.results.layout = {
        count: layouted.length,
        sections: sections,
        projects: layouted.map(p => ({
          id: p.id,
          title: p.titleKey,
          type: p.type,
          position: p.computedPosition
        }))
      };
      
      return layouted.length > 0;
    } catch (e) {
      this.log(`Layout test failed: ${e.message}`, 'error');
      this.results.layout = { error: e.message };
      return false;
    }
  }

  // Test 9: Data Flow Integrity
  async testDataFlow() {
    this.log('=== DATA FLOW INTEGRITY ===', 'info');
    
    try {
      const flow = {
        rawProjects: this.results.projectsDev?.count || 0,
        galleryFormat: this.results.galleryFormat?.count || 0,
        afterFilters: this.results.filters?.count || 0,
        rootProjects: this.results.root?.count || 0,
        layouted: this.results.layout?.count || 0
      };
      
      this.log(`Flow: Raw(${flow.rawProjects}) → Gallery(${flow.galleryFormat}) → Filters(${flow.afterFilters}) → Root(${flow.rootProjects}) → Layout(${flow.layouted})`, 'info');
      
      // Check for drop-offs
      const issues = [];
      if (flow.galleryFormat < flow.rawProjects) {
        issues.push('⚠️ Gallery format conversion lost projects');
      }
      if (flow.afterFilters < flow.galleryFormat && flow.galleryFormat > 0) {
        issues.push('⚠️ Filters removed projects - check active filters');
      }
      if (flow.rootProjects < flow.afterFilters && flow.afterFilters > 0) {
        issues.push('⚠️ All/most projects are sub-projects (have parentId)');
      }
      if (flow.layouted < flow.rootProjects && flow.rootProjects > 0) {
        issues.push('⚠️ Layout calculation failed for some projects');
      }
      
      if (issues.length > 0) {
        issues.forEach(issue => this.log(issue, 'warn'));
      } else {
        this.log('✓ Data flow integrity maintained', 'info');
      }
      
      this.results.dataFlow = {
        flow,
        issues,
        integrity: issues.length === 0
      };
      
      return issues.length === 0;
    } catch (e) {
      this.log(`Data flow test failed: ${e.message}`, 'error');
      this.results.dataFlow = { error: e.message };
      return false;
    }
  }

  // Generate Summary
  generateSummary() {
    const tests = [
      { name: 'Environment', result: this.results.environment },
      { name: 'Authentication', result: this.results.auth?.isLoggedIn },
      { name: 'Mock Data', result: this.results.mockData?.count > 0 },
      { name: 'Project Loading', result: this.results.projectsDev?.count > 0 },
      { name: 'Gallery Format', result: this.results.galleryFormat?.count > 0 },
      { name: 'Filters', result: this.results.filters?.count > 0 },
      { name: 'Root Projects', result: this.results.root?.count > 0 },
      { name: 'Layout', result: this.results.layout?.count > 0 },
      { name: 'Data Flow', result: this.results.dataFlow?.integrity }
    ];
    
    const passed = tests.filter(t => t.result).length;
    const failed = tests.length - passed;
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(50));
    
    tests.forEach(test => {
      const icon = test.result ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.result ? 'PASS' : 'FAIL'}`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - Check logs above');
    }
    
    this.results.summary = {
      total: tests.length,
      passed,
      failed,
      duration,
      tests
    };
    
    return this.results.summary;
  }

  // Export Results
  exportResults() {
    const blob = new Blob([JSON.stringify(this.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gallery-test-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.log('Results exported to file', 'info');
  }

  // Run All Tests
  async runAllTests() {
    console.log('\n' + '='.repeat(50));
    console.log('COMPREHENSIVE GALLERY TEST SUITE');
    console.log('='.repeat(50));
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50) + '\n');
    
    try {
      await this.testEnvironment();
      await this.testAuthentication();
      await this.testMockData();
      await this.testProjectLoadingDev();
      await this.testGalleryFormat();
      await this.testFilters();
      await this.testRootProjects();
      await this.testLayout();
      await this.testDataFlow();
      
      const summary = this.generateSummary();
      
      console.log('\n' + '='.repeat(50));
      console.log('QUICK FIX COMMANDS');
      console.log('='.repeat(50));
      
      if (!this.results.auth?.isLoggedIn) {
        console.log('1. Login: await useAuthStore().loginWithGoogle()');
      }
      if (!this.results.mockData?.count) {
        console.log('2. Reset mock: mockStore.reset()');
      }
      if (!this.results.projectsDev?.count) {
        console.log('3. Reload: await useProjectsStore().loadProjects()');
      }
      if (!this.results.filters?.count && this.results.galleryFormat?.count) {
        console.log('4. Clear filters: Object.assign(useGalleryStore(), { activeFilter: "todos", focusedType: null, activeAxisFilter: null, activeCategoryFilter: null, activeYearFilter: null })');
      }
      
      console.log('='.repeat(50));
      
      return {
        summary,
        fullResults: this.results,
        logs: this.logs
      };
    } catch (e) {
      this.log(`Test suite crashed: ${e.message}`, 'error');
      console.error(e);
      return {
        error: e.message,
        partialResults: this.results
      };
    }
  }
}

// Auto-execute
const testSuite = new ComprehensiveTestSuite();
const results = await testSuite.runAllTests();

// Make available globally
window.__GALLERY_TEST_RESULTS__ = results;
window.__GALLERY_TEST_EXPORT__ = () => testSuite.exportResults();

console.log('\n💡 TIP: Run window.__GALLERY_TEST_EXPORT__() to save results');

export default ComprehensiveTestSuite;
