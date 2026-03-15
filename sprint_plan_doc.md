# Sprint Plan: Color Wars MVP

## Sprint Goal
**Deliver the Minimum Viable Product (MVP) core loop**: Execute on the "Tension & Bleed" pillar by finalizing the dynamic economy, basic territory upgrades, and the bankruptcy elimination condition. This ensures the game is fully playable with a definitive win/loss state without needing complex asymmetric features like trading or missiles right away.

## Prioritization Framework Used
**Value vs Effort Matrix + RICE**
- High Value / Low Effort: Fixing Card Effects, Empire Tax.
- High Value / High Effort: Development Upgrades, Bankruptcy System.
- Low Value for MVP / High Effort: Trading System, Missile Silos (Pushed to later sprints).

---

## 🏃 Sprint 1: The Bleed & The Bank (Current)
*Focus: Enforcing the economy and establishing a win/loss state.*

### 1-A. Finish Card Effect Implementations (High Value, Low Effort)
- **Why**: Currently marked as a `TODO`. Card drafts happen but do nothing. Fixing this completes the `SURPRISE` tile mechanic.
- **Owner**: Backend
- **Story Points**: 2
- **Status**: Done

### 1-B. Implement The Empire Tax & Maintenance (High Value, Med Effort)
- **Why**: The core driver of gameplay. Players must lose money to create tension. Without this, hoarding empty territories is too powerful.
- **Owner**: Backend
- **Story Points**: 3

### 1-C. Bankruptcy & Elimination (High Value, Med Effort)
- **Why**: We need a way to kill players off when the Empire Tax drains their money. This creates the Secondary Win Condition (Last Player Standing). 
- **Owner**: Fullstack
- **Story Points**: 3

### 1-D. Basic Upgrades (Cities & Factories) (High Value, High Effort)
- **Why**: Players need a way to stop the "Bleed" and generate income. 
- **Owner**: Fullstack (UI + Server Schema)
- **Story Points**: 5

---

## 🏃 Sprint 2: The Spectacle & The Capital
*Focus: Providing the primary win condition and the Permit shop.*

### 2-A. The Permit Shop UI & Logic
- **Why**: Players need a reliable (but expensive) way to get Permits without relying on `SURPRISE` tile RNG.
- **Owner**: Frontend
- **Story Points**: 3

### 2-B. The Capital Monument & Panic Mode
- **Why**: The primary win condition. Requires stitching together permits, cards, money, and a full-round survival check.
- **Owner**: Fullstack
- **Story Points**: 5

### 2-C. VFX Triggers (Capital Built, Bankruptcy)
- **Why**: The game needs to fulfill its "Viral Spectacle" pillar. Red sirens for Panic Mode, massive text slams for bankruptcies.
- **Owner**: Frontend (PixiJS/GSAP)
- **Story Points**: 4

---

## 🏃 Sprint 3: Cutthroat Extortion
*Focus: Long-term interactive features for deep player engagement.*

### 3-A. Asynchronous Trading System
- **Why**: Allows for extortion and complex bargaining. High effort due to state synchronization across clients at any time.
- **Owner**: Fullstack
- **Story Points**: 8

### 3-B. Missile Silo Construction & Resolution
- **Why**: Allows players to nuke another player's Capital.
- **Owner**: Fullstack
- **Story Points**: 5

### 3-C. Emote System (Global Floating Emojis)
- **Why**: "Toxicity by design" - letting players mock each other's misfortune instantly.
- **Owner**: Frontend
- **Story Points**: 2

---

## Capacity & Risk Assessment
- **Primary Risk**: Client desync during complex transactions (Upgrades + Bankruptcy simultaneous execution).
- **Mitigation**: Rely strictly on `validateOrThrow()` composable rules before mutating `RoomState`.
- **MVP Validation**: At the end of Sprint 1, we should be able to play a full game where players eventually bleed out to the Empire Tax if they don't draw good cards.
