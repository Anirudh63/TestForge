import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main style={styles.container}>
      {/* Subtle background glow */}
      <div style={styles.bgGlow} />

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <span style={styles.logoText}>
            Test<span style={{ color: '#818cf8' }}>Forge</span>
          </span>
        </div>
        <Link href="/workspace" style={styles.navCta}>
          Open Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          AI-Powered Test Automation Platform
        </div>
        <h1 style={styles.title}>
          Ship Faster with<br />
          <span style={styles.gradient}>Intelligent Testing</span>
        </h1>
        <p style={styles.subtitle}>
          Connect your GitHub repos, generate comprehensive test cases with AI,
          and run them on cloud browsers — all from one dashboard.
        </p>

        <div style={styles.ctaGroup}>
          <Link href="/workspace" style={styles.primaryCta}>
            Get Started Free
          </Link>
          <a href="#features" style={styles.secondaryCta}>
            How It Works
          </a>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statValue}>10x</span>
            <span style={styles.statLabel}>Faster Testing</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>100%</span>
            <span style={styles.statLabel}>Cloud-Based</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>AI</span>
            <span style={styles.statLabel}>Driven Analysis</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3 style={styles.cardTitle}>AI Test Generation</h3>
          <p style={styles.cardText}>Analyze your codebase and automatically generate comprehensive test cases using advanced AI models.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h3 style={styles.cardTitle}>Cloud Execution</h3>
          <p style={styles.cardText}>Run Playwright scripts on Browserbase cloud infrastructure with session recording and live debugging.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <h3 style={styles.cardTitle}>Smart Dashboard</h3>
          <p style={styles.cardText}>Track pass rates, manage test suites, and monitor execution progress through an intuitive real-time workspace.</p>
        </div>
      </section>

      <footer style={styles.footer}>
        <span style={styles.footerLogo}>Test<span style={{ color: '#818cf8' }}>Forge</span></span>
        <span style={styles.footerDivider}>·</span>
        Built by Anirudh Dhage
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
    color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: '0 1.5rem 2rem',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '800px',
    height: '600px',
    background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1000px',
    padding: '1.25rem 0',
    zIndex: 1,
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#f8fafc',
    letterSpacing: '-0.01em',
  },
  navCta: {
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#cbd5e1',
    fontWeight: 500,
    fontSize: '0.85rem',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'background-color 0.2s',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '700px',
    marginTop: '4rem',
    marginBottom: '5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.9rem',
    borderRadius: '9999px',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    fontSize: '0.78rem',
    fontWeight: 500,
    color: '#a5b4fc',
    marginBottom: '1.75rem',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    letterSpacing: '0.01em',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#818cf8',
    display: 'inline-block',
  },
  title: {
    fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.1,
    margin: '0 0 1.5rem 0',
    color: '#f8fafc',
  },
  gradient: {
    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    lineHeight: 1.7,
    margin: '0 0 2.5rem 0',
    maxWidth: '520px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '3rem',
  },
  primaryCta: {
    padding: '0.75rem 2rem',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  secondaryCta: {
    padding: '0.75rem 2rem',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    fontWeight: 500,
    fontSize: '0.95rem',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '1.25rem 2rem',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
    width: '100%',
    maxWidth: '900px',
    marginBottom: '4rem',
    zIndex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '2rem 1.75rem',
    transition: 'transform 0.2s, border-color 0.25s, background-color 0.25s',
  },
  cardIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    margin: '0 0 0.5rem 0',
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  cardText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: 1.65,
    margin: 0,
  },
  footer: {
    fontSize: '0.8rem',
    color: '#475569',
    marginTop: 'auto',
    letterSpacing: '0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    zIndex: 1,
  },
  footerLogo: {
    fontWeight: 600,
    color: '#64748b',
  },
  footerDivider: {
    color: '#334155',
  },
};
