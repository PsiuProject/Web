<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="landing-nav">
      <div class="nav-container">
        <div class="nav-brand">PSIU</div>
        <div class="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <button class="btn-login" @click="handleLogin">Sign In</button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-badge">FREE • OPEN SOURCE</div>
        <h1 class="hero-title">
          VISUAL PROJECT
          <br />
          <span class="highlight">MANAGER</span>
        </h1>
        <p class="hero-subtitle">
          Map your ideas, connect projects, and collaborate in real-time on an infinite canvas.
          Built for teams who think visually.
        </p>
        <div class="hero-cta">
          <button class="btn-primary" @click="handleLogin">
            START FOR FREE
            <span class="arrow">→</span>
          </button>
          <button class="btn-secondary" @click="tryDemo">TRY DEMO</button>
        </div>
        <div class="hero-trust">
          <span>MADE BY CREATIVE RESEARCHERS</span>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section">
      <div class="features-container">
        <div class="features-header">
          <h2 class="section-title">POWERFUL FEATURES</h2>
          <p class="section-subtitle">Everything you need to organize complex projects visually</p>
        </div>

        <div class="features-list">
          <div class="feature-row">
            <div class="feature-content">
              <h3>VISUAL CANVAS</h3>
              <p>
                Organize projects spatially with cards, text, images, and connections. See the big
                picture at a glance with unlimited workspace that grows with your ideas.
              </p>
              <ul class="feature-bullets">
                <li>∞ Infinite canvas space</li>
                <li>📋 Rich card content</li>
                <li>🖼️ Image & media support</li>
              </ul>
            </div>
            <div class="feature-visual canvas-visual"></div>
          </div>

          <div class="feature-row reverse">
            <div class="feature-content">
              <h3>REAL-TIME COLLABORATION</h3>
              <p>
                Work together simultaneously with your team. Comments, edits, and changes sync
                instantly across all devices, keeping everyone aligned.
              </p>
              <ul class="feature-bullets">
                <li>⚡ Live sync across devices</li>
                <li>💬 Inline comments</li>
                <li>👥 Multi-user editing</li>
              </ul>
            </div>
            <div class="feature-visual collab-visual"></div>
          </div>

          <div class="feature-row">
            <div class="feature-content">
              <h3>SMART CONNECTIONS</h3>
              <p>
                Link related projects showing dependencies, inspirations, and relationships. Build
                knowledge networks that reveal how everything connects.
              </p>
              <ul class="feature-bullets">
                <li>🔗 Dependency mapping</li>
                <li>🎯 Custom connection types</li>
                <li>📊 Relationship visualization</li>
              </ul>
            </div>
            <div class="feature-visual connections-visual"></div>
          </div>

          <div class="feature-row reverse">
            <div class="feature-content">
              <h3>MULTI-LANGUAGE SUPPORT</h3>
              <p>
                Auto PT/EN translations with custom glossary. Work globally and communicate locally
                without friction or manual translation overhead.
              </p>
              <ul class="feature-bullets">
                <li>🌐 Auto PT/EN translation</li>
                <li>📚 Custom glossary</li>
                <li>🔄 One-click language switch</li>
              </ul>
            </div>
            <div class="feature-visual language-visual"></div>
          </div>

          <div class="feature-row">
            <div class="feature-content">
              <h3>FLEXIBLE SHARING</h3>
              <p>
                Private, public, or link-only access. Granular permissions control exactly who sees
                what, from private drafts to public portfolios.
              </p>
              <ul class="feature-bullets">
                <li>🔒 Private projects</li>
                <li>🔗 Shareable links</li>
                <li>👁️ View/edit permissions</li>
              </ul>
            </div>
            <div class="feature-visual sharing-visual"></div>
          </div>

          <div class="feature-row reverse">
            <div class="feature-content">
              <h3>OFFLINE MODE</h3>
              <p>
                No internet? No problem. Keep working offline and your changes sync automatically
                when you're back online. Never lose progress.
              </p>
              <ul class="feature-bullets">
                <li>💾 Local data storage</li>
                <li>🔄 Auto-sync on reconnect</li>
                <li>✓ Conflict resolution</li>
              </ul>
            </div>
            <div class="feature-visual offline-visual"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="how-it-works-section">
      <div class="section-container">
        <h2 class="section-title center">HOW IT WORKS</h2>

        <div class="steps-container">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>CREATE</h3>
              <p>
                Add projects as rich cards with descriptions, images, metadata, and custom fields
              </p>
            </div>
          </div>

          <div class="step-connector"></div>

          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>CONNECT</h3>
              <p>
                Draw connections between items showing dependencies, relationships, and workflows
              </p>
            </div>
          </div>

          <div class="step-connector"></div>

          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>COLLABORATE</h3>
              <p>
                Share with your team, gather feedback through comments, iterate together in
                real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">READY TO GET STARTED?</h2>
        <p class="cta-text">
          Join thousands of teams organizing their work with PSIU. Free forever for individuals. No
          credit card required.
        </p>
        <div class="cta-buttons">
          <button class="btn-primary large" @click="handleLogin">
            CREATE FREE ACCOUNT
            <span class="arrow">→</span>
          </button>
        </div>
        <p class="cta-note">Free • Open Source • No setup required</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="footer-logo">PSIU</span>
          <span class="footer-byline">Made by Earth Guardians</span>
        </div>
        <div class="footer-right">
          <span class="copyright">&copy; {{ new Date().getFullYear() }} PSIU</span>
          <span class="dot">•</span>
          <span class="license">Open Source</span>
        </div>
      </div>
    </footer>

    <!-- Auth Modal -->
    <AuthModal v-if="showAuth" @close="showAuth = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthModal from '../components/AuthModal.vue'

const router = useRouter()
const auth = useAuthStore()
const showAuth = ref(false)

const isDevMode = import.meta.env.DEV || window.location.hostname === 'localhost'

async function handleLogin() {
  if (isDevMode) {
    await auth.loginWithGoogle()
    // Redirect to /select after login in dev mode
    setTimeout(() => {
      router.push({ name: 'project-select' })
    }, 100)
  } else {
    showAuth.value = true
  }
}

function tryDemo() {
  router.push({ name: 'project-select' })
}
</script>

<style scoped>
/* CSS Variables */
.landing-page {
  --paper: #f0f0eb;
  --ink: #141412;
  --ink-light: #1e1e1c;
  --moss: #6a7d5b;
  --moss-light: #8a9f75;
  --terracotta: #c1442f;
  --orange: #ff5f1f;

  font-family: 'Outfit', sans-serif;
  background: var(--ink);
  color: var(--paper);
  line-height: 1.6;
}

/* Global Resets */
.landing-page * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

/* Navigation */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(20, 20, 18, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(106, 125, 91, 0.2);
}

.nav-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.875rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  font-family: 'Space Mono', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--paper);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: var(--moss-light);
  text-decoration: none;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--paper);
}

.btn-login {
  background: var(--terracotta);
  color: var(--paper);
  border: none;
  padding: 0.5rem 1.25rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-login:hover {
  background: var(--orange);
  transform: translateY(-1px);
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 4rem;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(106, 125, 91, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(193, 68, 47, 0.08) 0%, transparent 40%);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 750px;
}

.hero-badge {
  display: inline-block;
  background: rgba(106, 125, 91, 0.15);
  border: 1px solid rgba(106, 125, 91, 0.3);
  padding: 0.375rem 0.875rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--moss-light);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  font-weight: 900;
  line-height: 1.05;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 1.25rem;
}

.hero-title .highlight {
  color: var(--terracotta);
  display: block;
}

.hero-subtitle {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--moss-light);
  max-width: 580px;
  margin: 0 auto 2rem;
}

.hero-cta {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-primary {
  background: var(--terracotta);
  color: var(--paper);
  border: none;
  padding: 0.875rem 2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--orange);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(193, 68, 47, 0.3);
}

.btn-primary .arrow {
  transition: transform 0.2s;
}

.btn-primary:hover .arrow {
  transform: translateX(3px);
}

.btn-secondary {
  background: transparent;
  color: var(--paper);
  border: 1px solid rgba(106, 125, 91, 0.5);
  padding: 0.875rem 2rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(106, 125, 91, 0.1);
  border-color: var(--moss-light);
}

.hero-trust {
  font-family: 'Space Mono', monospace;
  font-size: 0.6875rem;
  color: var(--moss-light);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
}

/* Features Section */
.features-section {
  padding: 6rem 0;
  background: var(--ink);
  border-top: 1px solid rgba(106, 125, 91, 0.15);
}

.features-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

.features-header {
  margin-bottom: 4rem;
}

.section-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 0.75rem;
  color: var(--paper);
}

.section-title.center {
  text-align: center;
}

.section-subtitle {
  font-size: 1rem;
  color: var(--moss-light);
  max-width: 500px;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.feature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.feature-row.reverse {
  direction: rtl;
}

.feature-row.reverse > * {
  direction: ltr;
}

.feature-content h3 {
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  color: var(--paper);
}

.feature-content p {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--moss-light);
  margin-bottom: 1.5rem;
}

.feature-bullets {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-bullets li {
  font-family: 'Space Mono', monospace;
  font-size: 0.8125rem;
  color: var(--moss-light);
  padding-left: 0;
}

.feature-visual {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(106, 125, 91, 0.2);
  border-radius: 8px;
  min-height: 280px;
  position: relative;
  overflow: hidden;
}

.canvas-visual {
  background:
    linear-gradient(135deg, rgba(106, 125, 91, 0.1) 0%, transparent 50%),
    repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(106, 125, 91, 0.05) 40px),
    repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(106, 125, 91, 0.05) 40px);
}

.canvas-visual::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  border: 2px dashed rgba(106, 125, 91, 0.3);
  border-radius: 8px;
}

.collab-visual {
  background:
    radial-gradient(circle at 30% 40%, rgba(193, 68, 47, 0.2) 0%, transparent 20%),
    radial-gradient(circle at 70% 60%, rgba(106, 125, 91, 0.2) 0%, transparent 20%);
}

.connections-visual {
  background:
    linear-gradient(45deg, transparent 48%, rgba(106, 125, 91, 0.3) 50%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, rgba(106, 125, 91, 0.3) 50%, transparent 52%);
}

.language-visual {
  background: linear-gradient(90deg, rgba(106, 125, 91, 0.1) 0%, rgba(193, 68, 47, 0.1) 100%);
}

.sharing-visual {
  background: radial-gradient(circle at center, rgba(106, 125, 91, 0.15) 0%, transparent 70%);
}

.offline-visual {
  background: linear-gradient(
    180deg,
    rgba(106, 125, 91, 0.1) 0%,
    transparent 50%,
    rgba(106, 125, 91, 0.1) 100%
  );
}

/* How It Works Section */
.how-it-works-section {
  padding: 5rem 0;
  background: linear-gradient(180deg, var(--ink) 0%, var(--ink-light) 100%);
  border-top: 1px solid rgba(106, 125, 91, 0.15);
  border-bottom: 1px solid rgba(106, 125, 91, 0.15);
}

.section-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

.steps-container {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
}

.step-item {
  flex: 1;
  max-width: 280px;
  text-align: center;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--terracotta);
  border-radius: 50%;
  font-family: 'Space Mono', monospace;
  font-size: 1.25rem;
  font-weight: 900;
  margin-bottom: 1.25rem;
}

.step-content h3 {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
  color: var(--paper);
}

.step-content p {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--moss-light);
}

.step-connector {
  flex: 0 0 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--moss), transparent);
  margin-top: 28px;
  opacity: 0.4;
}

/* CTA Section */
.cta-section {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, rgba(193, 68, 47, 0.15) 0%, var(--ink) 100%);
  border-top: 1px solid rgba(193, 68, 47, 0.2);
}

.cta-content {
  max-width: 650px;
  margin: 0 auto;
  text-align: center;
}

.cta-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 0.75rem;
}

.cta-text {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--moss-light);
  margin-bottom: 2rem;
}

.cta-buttons {
  margin-bottom: 1rem;
}

.btn-primary.large {
  padding: 1rem 2.5rem;
  font-size: 0.875rem;
}

.cta-note {
  font-size: 0.75rem;
  font-family: 'Space Mono', monospace;
  color: var(--moss-light);
  opacity: 0.7;
}

/* Footer */
.landing-footer {
  background: rgba(20, 20, 18, 0.95);
  border-top: 1px solid rgba(106, 125, 91, 0.2);
}

.footer-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.footer-logo {
  font-family: 'Space Mono', monospace;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--paper);
}

.footer-byline {
  font-family: 'Space Mono', monospace;
  font-size: 0.6875rem;
  color: var(--moss-light);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.6875rem;
  color: var(--moss-light);
}

.dot {
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 968px) {
  .feature-row {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .feature-row.reverse {
    direction: ltr;
  }

  .step-connector {
    width: 2px;
    height: 40px;
    background: linear-gradient(180deg, var(--moss), transparent);
    margin: 1rem auto;
  }

  .steps-container {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 640px) {
  .nav-container {
    padding: 0.75rem 1.25rem;
  }

  .nav-links {
    display: none;
  }

  .hero-section {
    padding: 5rem 1.25rem 3rem;
  }

  .hero-cta {
    flex-direction: column;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .features-container {
    padding: 0 1.25rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1rem 1.25rem;
  }

  .footer-right {
    justify-content: center;
  }
}
</style>
