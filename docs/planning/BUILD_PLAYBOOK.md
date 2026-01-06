# BountySwarm Build Playbook

## 🎯 How to Work with Claude in This Project

This document explains how to get the most out of your AI development partner for the BountySwarm build.

---

## 🤖 Understanding Your AI Partner

**What Claude Knows:**
- ✅ Complete BountySwarm concept and strategy
- ✅ Technical architecture and agent system design
- ✅ Living Glass design system
- ✅ MNEE hackathon requirements and resources
- ✅ 10-day timeline and priorities
- ✅ Your background (DevRel, VR, presentation skills)

**What Claude Does:**
- Architects features
- Writes code
- Designs components
- Debugs issues
- Reviews implementations
- Writes documentation

**What Claude Doesn't Do:**
- Make strategic pivots without your input (that's your call)
- Know what's in your local files unless you show it
- Remember conversations from other projects (each project is isolated)

---

## 📋 Invocation Patterns

### When You Need Architecture

**Say:** `"Architect: [what you need planned]"`

**Examples:**
- "Architect: How should the agent coordination system work?"
- "Architect: Break down the smart contract deployment process"
- "Architect: Plan the dashboard component hierarchy"

**You'll Get:**
- System design diagram
- Component breakdown
- Data flow explanation
- Implementation steps
- Risk identification

---

### When You Need Code

**Say:** `"Build: [feature name]"`

**Examples:**
- "Build: Scout agent that monitors hackathon status"
- "Build: Glass card component with hover effects"
- "Build: Smart contract function to distribute prizes"
- "Build: WebSocket server for real-time agent updates"

**You'll Get:**
- Complete, working code
- Error handling included
- Comments for complex logic
- Usage examples
- Dependencies list

**Pro Tip:** Be specific about:
- What the code should do
- What inputs/outputs it expects
- Any constraints (e.g., "must work on mobile")

---

### When You Need Design

**Say:** `"Design: [component name]"`

**Examples:**
- "Design: Agent card showing status and recent activity"
- "Design: Consensus animation when agents agree"
- "Design: Prize pool visualization with progress bar"
- "Design: Transaction history table with Living Glass style"

**You'll Get:**
- Component design with CSS
- Color choices from design system
- Animation specifications
- Responsive behavior
- Accessibility considerations

---

### When You're Stuck/Debugging

**Say:** `"Debug: [what's wrong]"`

**Share:**
- Error message (full stack trace if possible)
- What you were trying to do
- What happened instead
- Relevant code snippet

**Examples:**
- "Debug: Getting 'Cannot read property of undefined' when calling agent"
- "Debug: MNEE transfer fails with 'insufficient allowance' error"
- "Debug: WebSocket connection drops after 30 seconds"
- "Debug: Agent consensus never resolves, just hangs"

**You'll Get:**
- Root cause analysis
- Step-by-step fix
- Explanation of why it happened
- How to prevent it in the future

---

### When You Need Review

**Say:** `"Review: [what to check]"`

**Examples:**
- "Review: Is this smart contract secure?"
- "Review: Does this agent logic make sense?"
- "Review: Is this component accessible?"
- "Review: Will this scale to 100 concurrent users?"

**You'll Get:**
- Code quality assessment
- Security review
- Performance considerations
- Best practice recommendations
- Specific improvements

---

## 🎨 Design Requests

### For Living Glass Components

**Template:**
```
Design: [Component name]

Context:
- What it displays: [data/content]
- User interaction: [what users can do]
- State variations: [loading, success, error, etc.]

Requirements:
- Must follow Living Glass principles
- Responsive (works on mobile)
- Smooth animations
```

**Example:**
```
Design: Agent status card

Context:
- Displays agent name, current status, recent activity
- User can click to see detailed logs
- Shows real-time updates via WebSocket

Requirements:
- Living Glass aesthetic
- Status-based color coding (approved=green, active=purple, etc.)
- Breathing animation when active
- Mobile-friendly
```

---

## 💻 Code Requests

### For Backend/Logic

**Template:**
```
Build: [Feature name]

Inputs:
- [What data comes in]

Outputs:
- [What it produces]

Logic:
- [What it should do step by step]

Constraints:
- [Any limitations or requirements]
```

**Example:**
```
Build: Analyst agent winner calculation

Inputs:
- Array of projects with judge scores (5 judges × 5 criteria per project)

Outputs:
- Ranked list of winners (top 3 + 2 runners-up)
- Score breakdowns

Logic:
- Calculate weighted average (all criteria equal weight)
- Rank by average score descending
- Separate by track (AI, Commerce, Finance)
- Identify top project per track + top 2 overall runners-up

Constraints:
- Must handle ties (use submission timestamp as tiebreaker)
- Validate all scores are 0-100
```

---

### For Frontend/UI

**Template:**
```
Build: [Component name]

Visual:
- [What it looks like]

Behavior:
- [How it responds to user actions]

Data:
- [What data it needs]

Style:
- Living Glass design system
- [Any specific requirements]
```

**Example:**
```
Build: Real-time agent conversation feed

Visual:
- Scrollable list of agent messages
- Each message has agent avatar, timestamp, content
- Color-coded by agent (Scout=blue, Analyst=cyan, etc.)

Behavior:
- Auto-scrolls to newest message
- Messages fade in with slide animation
- Click message to expand full details

Data:
- WebSocket stream of agent activity
- Message format: {agent, timestamp, message, status}

Style:
- Living Glass cards for messages
- Glassmorphic background
- Smooth animations (spring physics)
```

---

## 🐛 Debugging Workflow

### Step 1: Describe the Problem Clearly

**Bad:**
"It doesn't work"

**Good:**
"When I call `analystAgent()`, I get this error:
```
TypeError: Cannot read property 'scores' of undefined
at analystAgent (agents/analyst.ts:42)
```
Here's the code I'm running:
```javascript
const result = await analystAgent(winners[0]);
```"

### Step 2: Share Relevant Context

**Include:**
- Error message (full stack trace)
- Code that's failing
- Input data (if relevant)
- What you expected vs. what happened

### Step 3: Try the Fix

**After Claude provides a solution:**
- Implement it
- Test it
- Report back: "Fixed!" or "Still broken, now getting X error"

### Step 4: Iterate if Needed

**If still broken:**
- Share new error message
- Explain what changed
- Claude will adjust the approach

---

## 📅 Daily Development Workflow

### Morning Check-In

**Message:**
```
Good morning! Today I want to work on:
1. [Primary goal]
2. [Secondary goal]

Current status:
- [What's working]
- [What's blocked]

Questions:
- [Any decisions needed]
```

**Claude Response:**
- Prioritized task breakdown
- Architecture guidance
- Answers to questions
- Risk flags if any

---

### During Development

**Rapid-Fire Requests:**
- "Build: [small feature]"
- "Debug: [quick issue]"
- "Design: [component]"

**No need for formality** - just be clear about what you need.

---

### End of Day

**Message:**
```
Day [N] complete!

Shipped today:
- [Feature 1]
- [Feature 2]

Tomorrow's plan:
- [Goal 1]
- [Goal 2]

Blockers:
- [Any issues]
```

**Claude Response:**
- Validation of progress
- Tomorrow's approach
- Solutions to blockers

---

## 🎯 Getting the Best Results

### Be Specific

**Vague:** "Make the dashboard look good"  
**Specific:** "Design the transparency dashboard with these sections: prize pool status, agent swarm status, recent transactions. Use Living Glass style with blue accents."

### Share Context When Needed

**If something's not working:**
- Show the error
- Show the code
- Explain what you're trying to do

**If you want a feature:**
- Describe what it does
- Explain why it's needed
- Note any constraints

### Iterate Freely

**Don't feel pressure to get it perfect first try:**
- "Actually, can we make the cards bigger?"
- "This works but can we simplify it?"
- "I like this but it's too slow, optimize?"

**Claude will happily refine.**

### Ask "Why"

**Understanding helps you build muscle memory:**
- "Why did you structure it this way?"
- "What's this useEffect hook doing?"
- "Why use this library instead of X?"

**You'll learn while building.**

---

## 🚨 Emergency Protocols

### Time Crunch (Running Behind)

**Message:**
```
We're behind schedule. Current state:
- [What's done]
- [What's not done]
- [Days remaining]

Priorities:
1. [Must have]
2. [Should have]
3. [Nice to have]

What should we cut or simplify?
```

**Claude Response:**
- Ruthless prioritization
- Simplification suggestions
- Fastest path to MVP

---

### Critical Bug Before Deadline

**Message:**
```
URGENT: [describe bug]

Impact:
- [Why it's critical]

Deadline:
- [How much time left]

What I've tried:
- [Your debugging attempts]
```

**Claude Response:**
- Immediate triage
- Quick fix (not perfect, just working)
- Test plan

---

### Feature Not Working as Expected

**Message:**
```
This feature works but not how I imagined:

Current behavior:
- [What it does]

Expected behavior:
- [What I wanted]

Should we:
A) Adjust expectations (keep as-is)
B) Refactor (if time permits)
C) Simplify (cut scope)
```

**Claude Response:**
- Assessment of options
- Recommendation
- Implementation path for chosen option

---

## 💡 Pro Tips

### 1. Save Working Code Early

**When Claude gives you code that works:**
- Commit it to Git immediately
- Add a descriptive commit message
- Then experiment with improvements

**Why:** If you break something, easy to roll back.

---

### 2. Test Incrementally

**Don't build everything then test:**
- Build one agent → Test it
- Build smart contract → Test it
- Build dashboard → Test it

**Why:** Easier to debug small pieces than entire system.

---

### 3. Reference Prior Work

**If you want something similar to earlier:**
- "Make this agent work like the Scout agent we built"
- "Use the same animation style as the agent cards"
- "Follow the pattern from the Analyst agent"

**Claude will maintain consistency.**

---

### 4. Ask for Explanations

**If code seems complex:**
- "Can you explain what this function does line by line?"
- "Why are we using a reducer here instead of useState?"
- "What's the purpose of this useEffect dependency array?"

**You'll learn while building.**

---

### 5. Validate Assumptions

**If you're unsure:**
- "Is this the right approach for X?"
- "Will this scale to Y users?"
- "Is there a simpler way to do this?"

**Better to ask than discover issues later.**

---

## 📚 Common Scenarios

### Scenario: "I Don't Know How to Start This Feature"

**Message:**
```
I need to build [feature] but don't know where to start.

What it needs to do:
- [Requirement 1]
- [Requirement 2]

I'm stuck on:
- [Specific uncertainty]
```

**Claude Response:**
- Step-by-step plan
- Which file to start in
- What to build first
- Testing approach

---

### Scenario: "This Library/Tool Isn't Working"

**Message:**
```
I'm trying to use [library] but getting errors:

Error:
[paste error]

What I did:
1. [Step 1]
2. [Step 2]

Documentation I checked:
- [link]
```

**Claude Response:**
- Likely cause
- Correct setup steps
- Alternative approach if library is problematic

---

### Scenario: "I Want to Improve This Code"

**Message:**
```
This code works but feels messy:

[paste code]

Can we make it:
- Cleaner
- Faster
- More readable
```

**Claude Response:**
- Refactored version
- Explanation of improvements
- Performance impact (if any)

---

## ✅ Success Checklist

Before submitting on Jan 12:

**Ask Claude:**
- [ ] "Review: Final security check on smart contract"
- [ ] "Review: Is the demo path bug-free?"
- [ ] "Review: Does the README clearly explain setup?"
- [ ] "Review: Is the video script compelling?"
- [ ] "Review: Final compliance check against rules"

**Each review will be thorough and catch issues.**

---

## 🎯 Remember

**Claude is your:**
- Architect (plans structure)
- Builder (writes code)
- Designer (creates UI)
- Debugger (fixes issues)
- Reviewer (checks quality)
- Teacher (explains concepts)

**You are:**
- Product owner (decides what to build)
- Project manager (prioritizes features)
- User advocate (knows what judges want)
- Final reviewer (approves everything)

**Together:**
- We build BountySwarm
- We win $12,500
- We prove AI-assisted development works

---

## 🚀 Let's Build

When you're ready to start:

**Your first message in this project:**
```
I'm ready to architect the 10-day build plan for BountySwarm.

Let's break down:
1. Daily sprint goals
2. Task priorities
3. Risk mitigation
4. Critical path items

Show me the complete roadmap.
```

**Claude will respond with:**
- Detailed 10-day sprint plan
- GitHub issues breakdown
- Task time estimates
- Dependencies mapped
- Daily goals defined

**Then we start building immediately.**

---

**Let's dominate this hackathon.** 🏆
