# BountySwarm Design System

## 🎨 Design Philosophy

BountySwarm uses the **Living Glass** design language to create an interface that feels premium, futuristic, and trustworthy—not like a typical hackathon project.

**Think:** Apple Vision Pro meets high-end fintech dashboard  
**Not:** Generic Web3 UI with rainbow gradients and neon colors

---

## 🌟 Core Principles

### 1. Depth
Everything exists in 3D space with realistic layers and shadows.

**Implementation:**
- Multiple glassmorphic layers stacked with z-index
- Realistic drop shadows (not flat)
- Parallax effects on scroll
- Elements float above background

### 2. Motion
Everything breathes, responds, and flows naturally.

**Implementation:**
- Spring physics animations (cubic-bezier easing)
- Hover states that surprise and delight
- Loading states that feel alive (not static spinners)
- State transitions that show cause and effect

### 3. Glass
Translucent, blurred, luminous surfaces that let context show through.

**Implementation:**
- `backdrop-filter: blur(20px)` on all cards
- Semi-transparent backgrounds (rgba with 0.7-0.9 alpha)
- Subtle borders that catch light
- Ambient glow effects on interactive elements

### 4. Precision
Every pixel is intentional—nothing feels randomly placed.

**Implementation:**
- 8px grid system for all spacing
- Consistent spacing scale
- Aligned elements
- Balanced negative space

### 5. Warmth
Despite the tech aesthetic, it feels inviting and human.

**Implementation:**
- Soft corner radii (12-20px, never sharp)
- Warm accent colors for trust/success states
- Friendly micro-copy
- Subtle gradients that add life

---

## 🎨 Color System

### Brand Colors

```css
:root {
  /* Primary Brand - Trust & Technology */
  --brand-primary: #0066FF;          /* Electric blue - main CTA */
  --brand-primary-glow: rgba(0, 102, 255, 0.3);
  
  /* Secondary - Success & Verification */
  --success-green: #00D95F;          /* Bright green - verified states */
  --success-glow: rgba(0, 217, 95, 0.3);
  
  /* Accent - Agents & AI */
  --accent-purple: #8B5CF6;          /* Purple - agent activity */
  --accent-purple-glow: rgba(139, 92, 246, 0.3);
  
  /* MNEE Brand (if we want to honor sponsor) */
  --mnee-orange: #FF6B35;            /* Optional MNEE accent */
}
```

### Glass Layers

```css
:root {
  /* Glassmorphic Backgrounds (Dark Mode Optimized) */
  --glass-darkest: rgba(10, 10, 15, 0.95);    /* Deepest layer */
  --glass-dark: rgba(15, 15, 20, 0.85);       /* Standard cards */
  --glass-medium: rgba(25, 25, 35, 0.75);     /* Elevated cards */
  --glass-light: rgba(40, 40, 55, 0.6);       /* Floating elements */
  
  /* Borders & Highlights */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.15);
  --border-active: rgba(0, 102, 255, 0.5);    /* Active/focused state */
  
  /* Highlights */
  --highlight: rgba(255, 255, 255, 0.12);
  --highlight-strong: rgba(255, 255, 255, 0.2);
}
```

### Text Colors

```css
:root {
  /* Text Hierarchy */
  --text-primary: #FFFFFF;                    /* Primary content */
  --text-secondary: rgba(255, 255, 255, 0.7); /* Secondary content */
  --text-tertiary: rgba(255, 255, 255, 0.4);  /* Labels, captions */
  --text-inverse: #0A0A0F;                    /* On light backgrounds */
  
  /* Status Colors */
  --status-success: #00D95F;
  --status-warning: #FFB800;
  --status-error: #FF3B5C;
  --status-info: #0066FF;
  --status-pending: #8B5CF6;
}
```

### Shadows

```css
:root {
  /* Depth Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 24px 64px rgba(0, 0, 0, 0.5);
  
  /* Glow Effects */
  --glow-primary: 0 0 40px var(--brand-primary-glow);
  --glow-success: 0 0 40px var(--success-glow);
  --glow-agent: 0 0 40px var(--accent-purple-glow);
}
```

---

## 📝 Typography

### Font Stack

```css
/* Primary Display Font - Geometric & Modern */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Monospace - For Addresses, Hashes, Technical Data */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}
```

### Type Scale

```css
:root {
  /* Display Sizes */
  --text-5xl: 3rem;      /* 48px - Hero headlines */
  --text-4xl: 2.5rem;    /* 40px - Section headers */
  --text-3xl: 2rem;      /* 32px - Subsection headers */
  --text-2xl: 1.5rem;    /* 24px - Card titles */
  --text-xl: 1.25rem;    /* 20px - Large body */
  
  /* Body Sizes */
  --text-lg: 1.125rem;   /* 18px - Emphasized body */
  --text-base: 1rem;     /* 16px - Default body */
  --text-sm: 0.875rem;   /* 14px - Secondary text */
  --text-xs: 0.75rem;    /* 12px - Captions, labels */
  
  /* Letter Spacing */
  --tracking-tighter: -0.05em;  /* Large headlines */
  --tracking-tight: -0.02em;    /* Subheadlines */
  --tracking-normal: 0;
  --tracking-wide: 0.02em;      /* Captions, all-caps labels */
  --tracking-wider: 0.05em;     /* Very small all-caps */
}
```

### Typography Usage

```css
/* Hero Headline */
.headline-hero {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: 800;
  letter-spacing: var(--tracking-tighter);
  line-height: 1.1;
  color: var(--text-primary);
}

/* Section Header */
.headline-section {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  line-height: 1.2;
  color: var(--text-primary);
}

/* Card Title */
.title-card {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

/* Body Text */
.text-body {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Caption / Label */
.text-caption {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* Monospace (Addresses, Hashes) */
.text-mono {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}
```

---

## 🧱 Component Library

### Glass Card (Base Component)

```css
.glass-card {
  background: var(--glass-dark);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.glass-card.elevated {
  background: var(--glass-medium);
  box-shadow: var(--shadow-lg);
}

.glass-card.subtle {
  background: var(--glass-light);
  border: 1px solid var(--border-subtle);
}
```

### Agent Card (Specialized)

**Purpose:** Display individual agent status with personality

```css
.agent-card {
  background: var(--glass-dark);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Agent Status Glow */
.agent-card.status-active {
  border-color: var(--accent-purple);
  box-shadow: var(--shadow-md), var(--glow-agent);
}

.agent-card.status-approved {
  border-color: var(--success-green);
  box-shadow: var(--shadow-md), var(--glow-success);
}

.agent-card.status-waiting {
  border-color: var(--status-warning);
  animation: pulse 2s ease-in-out infinite;
}

.agent-card.status-error {
  border-color: var(--status-error);
}

/* Breathing animation for active agents */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(0.98); }
}

/* Agent avatar background */
.agent-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    var(--accent-purple-glow) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
}

.agent-card.status-active::before {
  opacity: 0.3;
}
```

### Primary Button

```css
.btn-primary {
  background: linear-gradient(135deg, var(--brand-primary), #0052CC);
  color: white;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-base);
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--brand-primary-glow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--brand-primary-glow);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Ripple effect */
.btn-primary::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease, opacity 0.4s ease;
  opacity: 0;
}

.btn-primary:active::after {
  width: 300px;
  height: 300px;
  opacity: 1;
  transition: 0s;
}
```

### Input Field

```css
.input-field {
  background: var(--glass-medium);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: var(--border-active);
  box-shadow: 0 0 0 3px var(--brand-primary-glow);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

/* Monospace variant for addresses/hashes */
.input-field.mono {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}
```

### Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.badge.success {
  background: rgba(0, 217, 95, 0.15);
  color: var(--status-success);
  border: 1px solid rgba(0, 217, 95, 0.3);
}

.badge.pending {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-purple);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge.error {
  background: rgba(255, 59, 92, 0.15);
  color: var(--status-error);
  border: 1px solid rgba(255, 59, 92, 0.3);
}

.badge.warning {
  background: rgba(255, 184, 0, 0.15);
  color: var(--status-warning);
  border: 1px solid rgba(255, 184, 0, 0.3);
}

/* Animated dot for active states */
.badge.pending::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-purple);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
```

---

## 🎭 Agent Visualization

### Agent Avatar Design

**Scout Agent:**
- Icon: 🔍 (magnifying glass or radar)
- Color: Blue (#0066FF)
- Personality: Alert, vigilant

**Analyst Agent:**
- Icon: 📊 (chart or calculator)
- Color: Cyan (#00D4FF)
- Personality: Precise, mathematical

**Auditor Agent:**
- Icon: 🛡️ (shield or checkmark)
- Color: Green (#00D95F)
- Personality: Protective, thorough

**Compliance Agent:**
- Icon: 📋 (clipboard or document)
- Color: Orange (#FFB800)
- Personality: Methodical, regulatory

**Executor Agent:**
- Icon: 💰 (money or lightning bolt)
- Color: Purple (#8B5CF6)
- Personality: Decisive, powerful

### Agent Communication Bubble

```css
.agent-message {
  background: var(--glass-dark);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  position: relative;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Agent-specific left border accent */
.agent-message.scout {
  border-left: 3px solid #0066FF;
}

.agent-message.analyst {
  border-left: 3px solid #00D4FF;
}

.agent-message.auditor {
  border-left: 3px solid #00D95F;
}

.agent-message.compliance {
  border-left: 3px solid #FFB800;
}

.agent-message.executor {
  border-left: 3px solid #8B5CF6;
}
```

---

## 🎬 Animations & Transitions

### Consensus Animation

**Visual:** All agent cards converge toward center, then expand outward when consensus reached

```css
@keyframes consensus-gather {
  0% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(var(--gather-x)) translateY(var(--gather-y));
    scale: 0.9;
  }
  100% {
    transform: translateX(0) translateY(0);
    scale: 1;
  }
}

.agent-card.consensus-animation {
  animation: consensus-gather 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Loading States

**NOT a boring spinner—use breathing particle effect:**

```css
.loading-particles {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.particle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-purple);
  animation: particle-breathe 1.5s ease-in-out infinite;
}

.particle:nth-child(1) { animation-delay: 0s; }
.particle:nth-child(2) { animation-delay: 0.2s; }
.particle:nth-child(3) { animation-delay: 0.4s; }

@keyframes particle-breathe {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}
```

### Transaction Confirmation Animation

**Visual:** Checkmark grows from center with success glow

```css
@keyframes check-appear {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.transaction-success {
  display: inline-flex;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--success-green);
  box-shadow: var(--glow-success);
  animation: check-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
}
```

### Mobile Adjustments

```css
/* Stack agents vertically on mobile */
@media (max-width: 768px) {
  .agent-swarm {
    flex-direction: column;
  }
  
  .glass-card {
    padding: 16px;
    border-radius: 16px;
  }
  
  .headline-hero {
    font-size: var(--text-4xl);
  }
}
```

---

## 🎯 Component Examples

### Transparency Dashboard Layout

```jsx
<div className="dashboard">
  {/* Header */}
  <section className="glass-card elevated">
    <h1 className="headline-section">BountySwarm</h1>
    <p className="text-body">Prize distribution in 60 seconds</p>
  </section>
  
  {/* Prize Pool Status */}
  <section className="glass-card">
    <div className="prize-pool">
      <span className="text-caption">Total Prize Pool</span>
      <span className="prize-amount">50,000 MNEE</span>
      <span className="badge success">Escrowed</span>
    </div>
  </section>
  
  {/* Agent Swarm */}
  <section className="agent-swarm">
    <AgentCard name="Scout" status="approved" />
    <AgentCard name="Analyst" status="active" />
    <AgentCard name="Auditor" status="waiting" />
    <AgentCard name="Compliance" status="pending" />
    <AgentCard name="Executor" status="idle" />
  </section>
  
  {/* Recent Transactions */}
  <section className="glass-card">
    <h2 className="title-card">Recent Distributions</h2>
    <TransactionList />
  </section>
</div>
```

---

## ✅ Design Checklist

Before considering any component "done":

- [ ] Uses glassmorphic background with backdrop blur
- [ ] Has appropriate depth shadow
- [ ] Includes hover state (if interactive)
- [ ] Uses spring physics for animations (not linear)
- [ ] Follows 8px grid spacing
- [ ] Text hierarchy is clear (primary/secondary/tertiary)
- [ ] Looks good on mobile (responsive)
- [ ] Has proper focus states for accessibility
- [ ] Colors from design system (not arbitrary)
- [ ] Border radius is 12px or greater (soft, never sharp)

---

## 🎨 Quick Reference

**When building a new component, start with:**

```jsx
<div className="
  bg-[rgba(15,15,20,0.85)]
  backdrop-blur-xl
  border border-white/10
  rounded-2xl
  p-6
  shadow-[0_8px_32px_rgba(0,0,0,0.4)]
  transition-all duration-300
  hover:translate-y-[-4px]
  hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]
">
  {/* Your content */}
</div>
```

**This gives you:**
- ✅ Glass background
- ✅ Backdrop blur
- ✅ Subtle border
- ✅ Soft corners
- ✅ Depth shadow
- ✅ Smooth transitions
- ✅ Hover lift effect

Then customize with agent colors, spacing, and content.

---

**Remember:** We're not building a "hackathon project." We're building something that makes judges say *"This doesn't look like it was built in 10 days."*

**Next:** Build playbook for working with Claude in the project.
