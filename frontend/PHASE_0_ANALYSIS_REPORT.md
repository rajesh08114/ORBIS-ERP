# ORBIS ERP Phase 0 Analysis Report

## Scope

Source analyzed: `stitch_flowforge_enterprise_erp`

Artifacts found:

- 43 folders total
- 40 `screen.png` files
- 40 `code.html` files
- 4 markdown/design reference files
- 3 design-only folders: `flowforge_erp_1`, `flowforge_erp_2`, `forge_dark_operations`

No application code was generated in Phase 0.

## Screen Inventory

| Folder | Proposed route | Theme | Size | Notes |
| --- | --- | --- | --- | --- |
| `audit_logs` | `/audit-logs` | Light | 551x1600 | Mobile audit timeline, filters, severity/activity feed |
| `bill_of_materials` | `/manufacturing/bom` | Light | 706x1600 | BOM detail/list hybrid for Drone Engine X-1 |
| `bill_of_materials_dark` | `/manufacturing/bom` | Dark | 706x1600 | Dark BOM detail, hierarchy, routing, cost analytics |
| `digital_twin_operations_dark` | `/digital-twin` | Dark | 394x1600 | FlowForge dark digital twin command center |
| `digital_twin_operations_dark_orbis` | `/digital-twin` | Dark | 393x1600 | ORBIS dark digital twin command center |
| `digital_twin_operations_hub` | `/digital-twin/hub` | Light | 1600x1280 | Desktop digital twin hub and workflow visualization |
| `digital_twin_operations_hub_orbis` | `/digital-twin/hub` | Light | 198x1600 | ORBIS branded mobile digital twin hub |
| `executive_dashboard` | `/executive` | Light | 253x1600 | Command center with KPI and chart stack |
| `executive_dashboard_dark` | `/executive` | Dark | 293x1600 | Dark executive dashboard / carousel style |
| `executive_dashboard_light` | `/executive` | Light | 174x1600 | FlowForge light executive intelligence |
| `executive_dashboard_light_orbis` | `/executive` | Light | 174x1600 | ORBIS light executive intelligence |
| `inventory_procurement` | `/inventory` and `/procurement` | Light | 364x1600 | Inventory and procurement hybrid dashboard |
| `login_dark` | `/login` | Dark | 923x1600 | Dark login with glass form |
| `login_light` | `/login` | Light | 706x1600 | FlowForge light login |
| `login_light_orbis` | `/login` | Light | 706x1600 | ORBIS light login |
| `main_dashboard_dark` | `/dashboard` | Dark | 299x1600 | Dark operational overview |
| `main_dashboard_dark_orbis` | `/dashboard` | Dark | 293x1600 | ORBIS dark operational overview |
| `main_dashboard_light` | `/dashboard` | Light | 312x1600 | Light operational insights |
| `manufacturing_command_center` | `/manufacturing/command-center` | Light | 487x1105 | Light manufacturing command center |
| `manufacturing_command_center_dark` | `/manufacturing/command-center` | Dark | 272x1600 | Dark live station monitor |
| `manufacturing_kanban` | `/manufacturing/kanban` | Light | 1600x1280 | Desktop kanban board |
| `manufacturing_kanban_dark` | `/manufacturing/kanban` | Dark | 706x1600 | Dark mobile kanban |
| `manufacturing_orders` | `/manufacturing/orders` | Light | 706x1600 | Manufacturing orders by status |
| `new_sales_order` | `/sales/orders/new` | Light | 346x1600 | Create sales order form |
| `orbis_erp_logo` | asset | Logo | 400x400 | ORBIS logo candidate |
| `order_details_so_2024_001` | `/sales/orders/[id]` | Light | 254x1600 | Sales order detail timeline and line items |
| `po_details_po_2024_0812` | `/purchase/orders/[id]` | Light | 282x1600 | Purchase order detail |
| `procurement_recommendations` | `/procurement/recommendations` | Light | 487x4737 | Very long procurement recommendation page |
| `procurement_recommendations_dark` | `/procurement/recommendations` | Dark | 706x1600 | Dark procurement recommendations |
| `purchase_orders` | `/purchase/orders` | Light | 259x1600 | FlowForge purchase orders |
| `purchase_orders_dark` | `/purchase/orders` | Dark | 470x1600 | Dark purchase orders table |
| `purchase_orders_orbis` | `/purchase/orders` | Light | 259x1600 | ORBIS purchase orders |
| `receive_items_po_0812` | `/purchase/receipts/new` | Light | 706x1600 | Receive items / purchase receipt |
| `sales_orders` | `/sales/orders` | Light | 706x1600 | Light sales orders table/cards |
| `sales_orders_dark` | `/sales/orders` | Dark | 706x1600 | Dark sales order list |
| `vendor_management` | `/purchase/vendors` | Light | 170x1600 | Vendor directory |
| `vendor_management_dark` | `/purchase/vendors` | Dark | 500x1600 | Dark vendor directory |
| `vendor_profile_titanium_corp` | `/purchase/vendors/[id]` | Light | 205x1600 | Vendor profile for Titanium Corp |
| `work_centers` | `/manufacturing/work-centers` | Light | 1600x1280 | Work center monitoring |
| `work_order_wo_8842` | `/manufacturing/work-orders/[id]` | Light | 274x1600 | Work order detail and progress |

## Route Inventory

Primary routes to implement from the Stitch export:

- `/login`
- `/dashboard`
- `/executive`
- `/digital-twin`
- `/digital-twin/hub`
- `/inventory`
- `/sales/orders`
- `/sales/orders/new`
- `/sales/orders/[id]`
- `/purchase/orders`
- `/purchase/orders/[id]`
- `/purchase/receipts/new`
- `/purchase/vendors`
- `/purchase/vendors/[id]`
- `/procurement/recommendations`
- `/manufacturing/command-center`
- `/manufacturing/orders`
- `/manufacturing/kanban`
- `/manufacturing/work-centers`
- `/manufacturing/work-orders/[id]`
- `/manufacturing/bom`
- `/audit-logs`

Routes required by the phase plan but not present in Stitch:

- `/products`
- `/products/new`
- `/products/[id]`
- `/inventory/ledger`
- `/inventory/timeline`
- `/inventory/health`
- `/customers`
- `/customers/[id]`
- `/purchase/vendors/new`
- `/manufacturing/bom/new`
- `/analytics`
- `/analytics/inventory`
- `/analytics/sales`
- `/analytics/procurement`
- `/analytics/manufacturing`
- `/analytics/executive`
- `/settings`
- `/profile`
- `/notifications`
- `/users`
- `/roles`
- `/help`
- `/forgot-password`

## Component Inventory

Shared shell components observed:

- Navigation drawer / side nav
- Top app bar / header
- Mobile bottom navigation
- Floating action button
- Search field / global search trigger
- User profile block
- Notifications trigger
- Settings trigger

Data and ERP components observed:

- KPI cards
- Metric cards
- Analytics cards
- Status badges/chips
- Risk/urgency indicators
- Progress bars
- Timeline items
- Stepper/status workflow
- Data tables
- Card-based mobile lists
- Pagination
- Filter bars
- Tabs/segmented filters
- Vendor cards
- Kanban columns/cards
- BOM hierarchy/tree
- Routing steps
- Purchase receipt item rows
- Sales and purchase order detail panels
- Audit diff cards
- Chart mockups: radial gauges, bars, lines, area charts, sparklines

Form components observed:

- Login form
- Text inputs
- Password input
- Checkbox
- Select/dropdown controls
- Create sales order form
- Purchase receipt quantity/actions
- Buttons: primary, secondary, ghost, icon-only

UX states observed or implied:

- Hover states
- Active nav state
- Loading/skeleton placeholders in vendor management
- Empty/add-new vendor tile
- Error/warning states
- Success/confirmed states
- Micro-interaction scripts embedded in generated HTML

## Theme Inventory

Light theme tokens appear across most FlowForge screens:

- Background: `#fff7f9`
- Surface/container range: `#ffffff`, `#faf1f4`, `#f4ecee`, `#efe6e9`, `#e9e0e3`
- Primary plum: `#57344f`
- Primary container: `#714b67`
- Secondary: `#7c5071`
- Text/on-surface: `#1e1b1d`, `#4e444a`
- Outline: `#80747a`, `#d1c3ca`
- Error: `#ba1a1a`, `#93000a`, `#ffdad6`
- Success/accent greens appear in inline utility colors and tertiary tokens.

Dark theme tokens appear in dark screens:

- Background/surface: `#131316`, with some pages using body background `#0f0f12`
- Containers: `#1b1b1e`, `#1f1f22`, `#2a2a2d`, `#353438`
- Text: `#e4e1e6`, `#d0c3cb`
- Primary/accent plum: `#e4b9df`, `#ab84a8`
- Outline: `#998e95`, `#4d444b`
- Error: `#ffb4ab`, `#93000a`
- Tertiary/success: `#bfcd94`, `#899663`

ORBIS-branded variants replace FlowForge labels and should be preferred where duplicate screens exist.

## Typography Inventory

The export consistently uses Inter via Google Fonts. The phase plan typography target should become canonical:

- Display: 48px
- H1: 36px
- H2: 30px
- H3: 24px
- H4: 20px
- Body: 16px
- Small: 14px
- Caption: 12px

Observed export typography includes additional Stitch variants:

- `display-lg`: 48px / 56px / 700
- `headline-xl`: 32px / 40px / 600
- `headline-lg`: 24px or 32px depending on file
- `title-md`: 18px / 24-28px / 600
- `body-md`: 14px / 20px
- `label-md`: 12-13px / uppercase tracking

Implementation should normalize these into a single Tailwind/shadcn token system.

## Design Token Inventory

Token families required:

- Colors: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, success, warning, info, surface depth tokens
- Typography: Inter family, semantic font sizes, weights, line heights
- Spacing: 4px baseline, xs/sm/md/lg/xl semantic spacing
- Radius: base 8px, cards 8px or 16px depending density, full for pills
- Shadows: subtle light-mode elevation, tonal dark-mode elevation
- Charts: plum, emerald, amber, red, blue/teal support colors
- Layout: desktop sidebar 240-280px, responsive content gutters, mobile bottom nav safe area
- Motion: small hover/press transitions, page transitions, digital twin pulse/flow animations

## Dark Mode Coverage

Dark screens present:

- Login
- Dashboard
- Executive dashboard
- Digital twin
- Bill of materials
- Manufacturing command center
- Manufacturing kanban
- Procurement recommendations
- Purchase orders
- Sales orders
- Vendor management

Dark screens missing:

- Audit logs
- Inventory overview/procurement
- Sales order detail
- Create sales order
- Purchase order detail
- Purchase receipt
- Vendor profile
- Manufacturing orders
- Work centers
- Work order detail
- Product module
- Customer module
- Analytics module
- Settings/profile/admin screens

Estimated dark coverage for exported screens: 11 of 40 screen images, about 28%.

## Light Mode Coverage

Light screens present:

- Login
- Dashboard
- Executive dashboard
- Digital twin hub
- Inventory/procurement
- Sales order list/detail/create
- Purchase order list/detail/receipt
- Vendor directory/profile
- Procurement recommendations
- Manufacturing command center/orders/kanban/work centers/work order/BOM
- Audit logs

Light screens missing:

- Product list/details/create/edit
- Inventory ledger/timeline/health/risk standalone screens
- Customer list/details
- BOM builder/new BOM
- Analytics dashboards
- Settings/profile/notifications/help
- User and role management
- Forgot password

Estimated light coverage for exported screens: 28 of 40 screen images, about 70%. The remaining item is the logo asset.

## Missing Screens

Critical missing screens by phase:

- Product module: list, details, create, edit
- Inventory module: ledger, timeline, stock movements, inventory health, inventory risk
- Sales module: customer details/customer management
- Purchase module: vendor create/edit
- Manufacturing module: BOM builder, work order dark mode
- Analytics module: inventory, sales, procurement, manufacturing, executive analytics
- Admin: users, roles, settings, profile, notification center, help center
- Auth: forgot password, reset password

## Duplicate Screens

Prefer ORBIS versions where available:

- `login_light` and `login_light_orbis`
- `main_dashboard_dark` and `main_dashboard_dark_orbis`
- `executive_dashboard_light` and `executive_dashboard_light_orbis`
- `digital_twin_operations_dark` and `digital_twin_operations_dark_orbis`
- `digital_twin_operations_hub` and `digital_twin_operations_hub_orbis`
- `purchase_orders` and `purchase_orders_orbis`

Functional duplicates or paired variants:

- `executive_dashboard`, `executive_dashboard_dark`, `executive_dashboard_light`, `executive_dashboard_light_orbis`
- `bill_of_materials`, `bill_of_materials_dark`
- `manufacturing_kanban`, `manufacturing_kanban_dark`
- `manufacturing_command_center`, `manufacturing_command_center_dark`
- `sales_orders`, `sales_orders_dark`
- `purchase_orders`, `purchase_orders_dark`, `purchase_orders_orbis`
- `vendor_management`, `vendor_management_dark`
- `procurement_recommendations`, `procurement_recommendations_dark`

## Implementation Roadmap

Phase 1 should create the Next.js 15 application foundation, install the required stack, and establish route groups that map to the inventory above.

Phase 2 should convert Stitch token values into production CSS variables and Tailwind theme extensions, with ORBIS as the brand name and FlowForge as legacy source text only.

Phase 3 should implement reusable components before feature pages: app shell, buttons, inputs, cards, badges, tables, metrics, charts, command palette, modal/drawer, skeletons, empty/error states.

Phase 4 should build the application shell using the export's recurring sidebar, top bar, mobile bottom nav, user block, search, notifications, workspace switcher, and theme toggle.

Phases 5-6 should create typed mock ERP data and a service/query layer before page modules, so all screens are data-driven and backend-ready.

Phases 7-16 should implement modules in this order:

1. Dashboards and digital twin
2. Sales and purchase modules
3. Inventory and procurement
4. Manufacturing, work orders, work centers, kanban, BOM
5. Audit logs
6. Analytics and missing admin/settings surfaces

Phase 17 should add global UX behavior: command palette, shortcuts, toasts, transitions, optimistic updates, and consistent loading/error/empty states.

Phase 18 should validate build, TypeScript, accessibility, responsive behavior, dark/light parity, route coverage, duplicate component removal, and backend integration readiness.

## Phase 0 Status Report

Implementation Summary:

- Completed analysis of folders, screen assets, HTML exports, and design markdown references.
- Identified canonical ORBIS variants, duplicate FlowForge variants, theme coverage, missing screens, and route targets.
- No production code was generated.

Files Created:

- `PHASE_0_ANALYSIS_REPORT.md`

Files Modified:

- None

Components Created:

- None

Routes Created:

- None

Types Created:

- None

Hooks Created:

- None

Services Created:

- None

Build Status:

- Not run. No application code exists yet in the workspace.

TypeScript Status:

- Not run. No TypeScript project exists yet in the workspace.

Dark Mode Status:

- Analyzed. Dark coverage is partial and should be normalized in later phases.

Responsive Status:

- Analyzed. Export contains mixed mobile and desktop compositions. Implementation must support both intentionally instead of copying viewport-specific artifacts blindly.

## Phase Checklist

- [x] All folders analyzed
- [x] All `screen.png` files inventoried
- [x] All `code.html` files inventoried
- [x] Screen inventory generated
- [x] Route inventory generated
- [x] Component inventory generated
- [x] Theme inventory generated
- [x] Typography inventory generated
- [x] Design token inventory generated
- [x] Dark mode coverage generated
- [x] Light mode coverage generated
- [x] Missing screens identified
- [x] Duplicate screens identified
- [x] Implementation roadmap generated
- [x] Complete analysis report delivered
- [x] Complete ERP roadmap delivered
