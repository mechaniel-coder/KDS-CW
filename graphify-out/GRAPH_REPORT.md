# Graph Report - .  (2026-07-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 54 nodes · 88 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `90147b48`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8

## God Nodes (most connected - your core abstractions)
1. `request()` - 10 edges
2. `loadTab()` - 8 edges
3. `renderMembers()` - 7 edges
4. `loadStats()` - 6 edges
5. `renderOrders()` - 6 edges
6. `renderDonations()` - 6 edges
7. `renderSubmissions()` - 6 edges
8. `esc()` - 5 edges
9. `showTabError()` - 5 edges
10. `wrapTable()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `renderDonations()` --calls--> `money()`  [EXTRACTED]
  admin.js → admin.js  _Bridges community 1 → community 2_
- `loadTab()` --calls--> `clearTabError()`  [EXTRACTED]
  admin.js → admin.js  _Bridges community 7 → community 1_
- `checkoutDonate()` --calls--> `request()`  [EXTRACTED]
  api.js → api.js  _Bridges community 4 → community 3_
- `tryResumeSession()` --calls--> `request()`  [EXTRACTED]
  api.js → api.js  _Bridges community 4 → community 8_

## Import Cycles
- None detected.

## Communities (12 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (6): cartCount(), cartTotalCents(), clearCartError(), openCart(), renderCart(), renderProducts()

### Community 1 - "Community 1"
Cohesion: 0.53
Nodes (6): enterDashboard(), loadStats(), loadTab(), money(), renderSubmissions(), showTabError()

### Community 2 - "Community 2"
Cohesion: 0.60
Nodes (6): esc(), fmtDate(), renderDonations(), renderMembers(), renderOrders(), wrapTable()

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (3): checkoutDonate(), login(), verifyJoin()

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (6): checkoutShop(), listProducts(), logout(), register(), request(), sendContact()

## Knowledge Gaps
- **1 isolated node(s):** `canvas`
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `request()` connect `Community 4` to `Community 8`, `Community 3`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `loadTab()` connect `Community 1` to `Community 2`, `Community 7`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `renderMembers()` connect `Community 2` to `Community 1`, `Community 7`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `canvas` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._