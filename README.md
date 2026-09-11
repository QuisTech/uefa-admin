# UEFA Horizon Strategy Engine V3 (`uefa-admin`)

> **Operations Research & Quantitative Strategy Engine for UEFA Champions League Fantasy**

`uefa-admin` is a full-stack, enterprise-grade quantitative optimization engine and interactive manager dashboard built specifically for **UEFA Champions League Fantasy**. It combines live official UEFA feeds, an Operations Research Integer Linear Programming (ILP) LP solver, custom per-90 expected points modeling (including Ball Recoveries, Player of the Match awards, and Outside-Box Goals), 3 strategy risk profiles, dual-scenario optimization, and top-manager consensus intelligence with chip normalization.

---

## 🌟 Key Features

### 1. Operations Research Integer Linear Programming (ILP) Solver
- Powered by `javascript-lp-solver` to solve exact mathematical squad optimization.
- **Budget Constraint**: Strictly enforces squad valuation cap (e.g. €100.0M).
- **Squad Quotas**: Exactly 15 players (2 GKP, 5 DEF, 5 MID, 3 FWD).
- **Starting XI Formations**: Validates legal formations (1 GKP, 3–5 DEF, 3–5 MID, 1–3 FWD).
- **Club Limit**: Enforces maximum of 3 players per UEFA Champions League club (e.g. Real Madrid, Man City, Bayern Munich, Barcelona, Inter, Paris).

### 2. Custom UEFA Champions League Scoring Model
- Incorporates official UEFA scoring rules:
  - **Ball Recoveries (`bR`)**: 3 recoveries = +1 pt (`floor(bR / 3)`).
  - **Player of the Match (`mOM`)**: +3 pts bonus per award.
  - **Goals Outside Box (`gOB`)**: +1 pt bonus per long-range goal.
  - **Appearance & Minutes**: Expected appearance probability based on live injury status, trained tags, and historical minutes.
  - **Positional Points**: Custom clean sheet and goal multipliers by position (GKP, DEF, MID, FWD).

### 3. 3 Risk Strategy Profiles
- **SAFE Mode**: Enforces Effective Ownership (EO) guardrails to shield your rank against market consensus template stars.
- **VALUE Mode**: Maximizes Expected Value per million spent (`xP / €M`) across the squad.
- **RISKY Mode**: Relaxes market consensus constraints to target high-upside differential rank climbs.

### 4. Dual-Scenario Optimization Engine
- **Quant Optimum**: Mathematical global optimal squad maximizing total expected points + 2× captain multiplier.
- **Template Shield**: Hard-locks high-conviction herd consensus picks to protect rank stability.
- **Delta Analysis**: Displays expected points difference, Effective Ownership (EO) divergence, and tactical swap recommendations.

### 5. Top Manager Intelligence & Elite Consensus
- **Edge Rating Badge**: Quantifies market disagreement percentage.
- **Cohort Filtering**: Interactive filter tabs (`All`, `Pure 0-Chips`, `TC/BB Normalized`).
- **Leaderboard & Squad Sync (`⚡ Sync Squad`)**: View real top manager rankings and instantly sync any manager ID directly into the Horizon strategy engine.
- **Split Consensus View**:
  - **🔥 Starting Weapons**: High-conviction starting assets (`StartRate ≥ 50%`) ranked by conviction score with `% Start` and `% Cap`.
  - **🪑 Bench Enablers**: High-value budget enablers (`Cost ≤ €5.5M`, `BenchRate ≥ 15%`) used to unlock premium Starting Weapons.

### 6. Chip Normalization Engine
- **Active Chip Isolation**: Filters out Wildcard and Limitless infinite-budget squads from herd consensus.
- **Score Normalization**: Deducts single-boost chip bonuses (e.g. 3× Captain extra multiplier) to measure true organic manager performance.

### 7. Diagnostic Omission Analysis ("Why Omitted?")
- Accordion diagnostic panel analyzing high-profile template stars left out of the XI.
- Displays `+net xP` gain metrics and squad reallocation rationale with funded starter badges.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend Server**: Node.js, Express, TypeScript (TSX runner)
- **Mathematical Optimization**: Operations Research ILP (`javascript-lp-solver`)
- **Data Validation & Schemas**: Zod, Axios

---

## 📁 Repository Structure

```
uefa-fantasy/
├── api/                        # Backend Server & Service Layer
│   ├── index.ts                # Primary UEFAService entry point & REST endpoints
│   └── _lib/
│       ├── ingestion.ts        # Data ingestion & UEFAOracle expected points engine
│       ├── lp-solver.ts        # Integer Linear Programming (ILP) LP solver
│       ├── manager-snapshot-service.ts # Chip normalization & Top Manager Intelligence
│       ├── projection.ts       # Risk parameters & projection engine
│       └── types.ts            # TypeScript interfaces & Zod validation schemas
├── src/                        # React Frontend Application
│   ├── components/
│   │   ├── EngineDiagnostics.tsx # Diagnostics HUD, Top Manager Intelligence, Consensus
│   │   ├── Header.tsx          # Top 12-column header, mode selectors, scenario toggle
│   │   ├── MetricsColumn.tsx   # Left 3-column squad metrics & captain card
│   │   ├── PitchView.tsx       # Center tactical pitch view & scenario comparison
│   │   ├── DataGrid.tsx        # Player candidate lock/exclude grid
│   │   ├── TransferView.tsx    # Transfer recommendations advisor
│   │   ├── ChipAdvisor.tsx     # Chip strategy recommendation view
│   │   ├── FixtureList.tsx     # Matchday schedule & fixture difficulty
│   │   └── PerformanceView.tsx # Historical & projected performance charts
│   ├── App.tsx                 # Main 12-column grid dashboard layout
│   ├── main.tsx                # React root mount point
│   ├── types.ts                # Frontend TypeScript declarations
│   └── index.css               # Tailwind CSS & global styles
├── server.ts                   # Express proxy server & Vite dev integration
├── package.json                # Dependencies & script definitions
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v22.x recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/QuisTech/uefa-admin.git
   cd uefa-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   *The Express server and Vite frontend will start on [http://localhost:3000](http://localhost:3000).*

### Production Build & Type Checking

- **Run Type Checker**:
  ```bash
  npx tsc --noEmit
  ```

- **Build Production Bundle**:
  ```bash
  npm run build
  ```

---

## 📊 Mathematical Formulation

### Expected Points (xP) Formula
`xP = P(appearance) × (AppPts + ExpGoals + ExpAssists + ExpCleanSheet + ExpBallRecoveries + ExpPOTM + ExpOutsideBoxGoals)`

### LP Optimization Problem
`Maximize: Sum(xP_XI) + xP_Captain`

Subject to:
- `Sum(Cost_Squad) ≤ €100.0M`
- Squad composition: 2 GKP, 5 DEF, 5 MID, 3 FWD (Total 15 players)
- Starting XI formation: 1 GKP, 3–5 DEF, 3–5 MID, 1–3 FWD (Total 11 players)
- Club max limit: `Count(Players from Team_K) ≤ 3` for all UEFA clubs.

---

## 📄 License

MIT License. Designed & Developed by Quant Strategists for UEFA Champions League Fantasy.
