# PawPatrol — Stray Rescue App: Full Design Spec

Source of truth for a production React Native + backend rebuild. Derived exhaustively from:
- `PawPatrol.dc.html` (1406 lines) — all screen markup (lines 1–831) + embedded app logic script (`<script type="text/x-dc" data-dc-script>`, lines 832–1404)
- `support.js` (1911 lines) — **NOT app logic**. It is the generic "dc-runtime" template/component engine (template compiler, `{{ }}` expression resolver, `sc-if`/`sc-for` control flow, React component factory, registry, streaming support). It contains zero PawPatrol-specific data — all mock data, strings, and handlers live inline in the `.dc.html` file's script block instead.
- `ios-frame.jsx` (352 lines) — device chrome only (see §0).

---

## 0. About `ios-frame.jsx` and `support.js` (housekeeping)

**`ios-frame.jsx`** is a self-contained, dependency-free iOS 26 "Liquid Glass" device-frame component library used purely as design-tool chrome to preview the screens inside a realistic iPhone bezel. It exports `IOSDevice` (the outer bezel + dynamic island + status bar + home indicator, 402×874 default), plus `IOSStatusBar`, `IOSNavBar`, `IOSGlassPill` (blurred pill buttons), `IOSList`/`IOSListRow` (grouped settings-style list), and `IOSKeyboard` (a full QWERTY glass keyboard mockup). The actual PawPatrol screen is mounted as `children` inside `<IOSDevice dark="{{ isDark }}">`; the app's own top status bar (rendered inline in the onboarding screen, "9:41"-style) is separate from `IOSStatusBar` — the app screens manage their own top padding (`padding-top: 56–64px`) to clear the simulated status bar. Not app logic; safe to ignore for the rebuild except as a reference for iOS chrome dimensions.

**`support.js`** is the compiled "dc-runtime" — the framework that parses `<x-dc>`/`sc-if`/`sc-for`/`{{ }}` template syntax into React, manages a component registry with hot-reload/streaming support, resolves `x-import`/`dc-import` external components, and boots the whole thing via CDN-loaded React 18 + Babel standalone. It is pure infrastructure (parser, expression evaluator, React reconciliation glue) — there is no mock data, no `t` strings object, and no event-handler bodies in this file. All of that (§2–§5 below) is defined in the `<script data-dc-script>` block inside `PawPatrol.dc.html` itself, which declares `class Component extends DCLogic { state = {...}; ...handlers...; renderVals() {...} }`.

---

## 1. App overview & roles

PawPatrol is a community stray-animal rescue coordination app (Kochi, Kerala setting) with three onboarding-selected roles that reshape the same screen set:

- **Reporter** (default/general public): sees a live map of nearby cases, can file a new report via a 5-step guided flow (photo → AI species/condition tags → location pin → urgency/notes → success), tracks "My activity" (Reported/Claimed/Resolved tabs), browses shelters/vets and adoptable animals, has a profile. Bottom tab bar: Map · Cases · Adopt · Shelters · Profile.
- **Volunteer / Rescuer**: same map/case infrastructure but tuned for response — the map FAB is a checkmark ("claim nearest case") instead of a plus ("report"), the "My Cases" screen becomes a "Case queue" with Nearby/Claimed/Resolved tabs (map only shows *open* cases), and once claimed they can advance a case's status and chat with the reporter. Bottom tab bar: Queue · Map · Shelters · Profile (no Adopt tab).
- **NGO / Shelter** (org staff): lands on a Dashboard (open/claimed/resolved counts + "most urgent" list) instead of the map, has a full Case Queue with assign/reassign, and in Case Detail gets an NGO-only panel (assigned volunteer, internal notes, verify-resolution action). Bottom tab bar: Dashboard · Queue · Shelters · Profile.

Role selection happens once, right after onboarding, and is stored as `state.role` (`'reporter' | 'volunteer' | 'ngo' | null`); it permanently swaps which tab bar renders and gates several conditional views (see §4).

---

## 2. Full screen inventory

All screens are siblings inside one root template, toggled by boolean `sc-if` flags computed in `renderVals()` from `state.screen`. Copy below is pulled from `STRINGS.en` (the `t` object) where the markup references `t.xxx`; literal (non-`t`) copy is quoted as-is.

### 2.1 Onboarding (`isOnboarding`, `state.screen === 'onboarding'`)
Dark full-bleed screen (`#163832` bg, cream `#fbf6ea` text). Elements:
- Top-right "Skip" link (`t.skip` = "Skip") → `skipOnboarding()`
- Illustration placeholder card (280×200, decorative animated blobs, `ppBlob` keyframe)
- Slide title (`onboardSlide.title`, whitespace-pre-line, 26px/800) and body (15px), driven by `state.onboardIndex` (0–2) into `ONBOARD`/`STRINGS.slide1-3`:
  1. "Every stray deserves\na chance" / "Spot a dog, cat or cow in trouble on the street? Report it in under 30 seconds — no calls, no waiting on hold."
  2. "Nearest rescuer\ngets notified" / "Your report reaches volunteers, NGOs and shelters near the location instantly, so help is on the way fast."
  3. "Together, we map\nthe city's care" / "Every case you report helps build a live picture of stray welfare across your city — so help goes where it's needed most."
- 3 progress dots (`onboardDots`; active dot widens to 22px, cream; inactive 8px, translucent)
- Bottom CTA pill button, label = `onboardButtonLabel` ("Next" on slides 1–2, "Get started" on slide 3) → `onboardNext()` (advances `onboardIndex`, or on last slide sets `screen: 'roleSelect'`)

### 2.2 Role Select (`isRoleSelect`)
Light screen (`#fbf6ea`). `t.howHelp` = "How will you help?", `t.howHelpSub` = "Pick a role to get started — you can always add more later." Three selectable role cards (Reporter/Volunteer/NGO), each: 44px icon tile, label (`t.reporterLabel`/`volunteerLabel`/`ngoLabel`), description (`t.reporterDesc`/`volunteerDesc`/`ngoDesc`), and a radio dot — selection state driven by `roleMeta(id)` (border/bg/iconBg/dot color flip to teal `#1f5d50` when `state.role === id`). Card `onClick` → `selectReporterRole`/`selectVolunteerRole`/`selectNgoRole` (all call `pickRole(id)`, just sets `state.role`, does not navigate yet). Bottom CTA "Continue" (`t.continueBtn`), disabled-looking (gray) until a role is picked, → `confirmRole()` which navigates to `ngoDashboard` (ngo), `myCases` (volunteer, tab defaults to `nearby`), or `home` (reporter).

### 2.3 Home / Map (`isHome`)
Header: "LIVE RESCUE MAP" label (`t.liveRescueMap`, uppercase 11px) + location pin icon + `t.location` ("Kochi, Kerala"); notification bell (→ `goNotifications`) with animated red unread dot (`hasUnread`, `ppDot` blink) when any notification is unread; teal avatar circle "R" (static, no handler — profile access is via tab bar).
- **Species filter chips** (horizontal scroll): All/Dog/Cat/Cattle, `chip.select` → `setSpeciesFilter(v)`; active chip is solid teal.
- **Urgency filter chips**: "All urgency"/Critical/Needs attention/Monitoring, each (except All) with a colored dot matching `URGENCY` palette; `chip.select` → `setUrgencyFilter(v)`; active chip solid dark green.
- **Map canvas**: dotted-grid background; `mapPins` rendered from filtered case list (excludes resolved; volunteers only see `status==='open'`; further filtered by species/urgency). Each pin is a colored dot sized 26px with white ring; critical+open cases get an extra pulsing ring (`ppPulse`). Pin click → `selectPin(id)`.
- **Selected-pin popup card** (bottom-anchored, appears on pin select): thumbnail placeholder, "{species} · {urgencyLabel}", "{distance} · {time}", "View" button → `openCase(id)`.
- **FAB** (56px circle, bottom-right, breathing glow animation `ppBreath`): plus icon for reporters (→ `startReport`/`fabAction`), checkmark icon for volunteers (→ `fabAction`, which auto-claims the nearest open case by distance and toasts "Claimed nearest case: {id}", or toasts "No unclaimed cases nearby" if none).
- Bottom spacer (86px) to clear the tab bar.

### 2.4 Report Flow (`isReport`) — 5 steps, shared header
Header: back chevron (→ `reportBack`: steps 2–4 go back a step, step 1 exits to home) + 4-segment progress bar (`reportStepDots`, filled up to current step).

**Step 1 — Capture photo** (`isReportStep1`): `t.snapPhoto` = "Snap a photo", `t.snapSub` = "Our AI will identify the animal and its condition." Camera viewfinder area has two states: `cameraIdle` (dashed placeholder box, "camera viewfinder" mono text) and `cameraActive` (teal-bordered box with a "LIVE" pulsing-dot badge and "camera viewfinder — aim & tap capture" mono text). Hidden `<input type=file accept=image/*>` wired to `handleFileChosen`. Large 68px shutter button: if camera inactive, click opens the capture-choice bottom sheet (`openCaptureChoice`/`shutterAction`); if camera active, click calls `takePhoto()` (fakes a 1.1s "analyzing" delay then flags `analyzed:true`). **Capture-choice bottom sheet** (`captureChoiceOpen`): scrim (click → `closeCaptureChoice`), sheet with "Snap a photo" → `chooseTakePhoto` (sets `cameraActive:true`), "Upload from gallery" (`t.uploadGallery`) → `chooseGallery` (closes sheet, triggers hidden file input via `triggerGalleryPick`), "Cancel" (`t.cancel`) → `closeCaptureChoice`.

**Step 2 — Confirm AI tags** (`isReportStep2`): `t.confirmDetails` = "Confirm details". 64px photo thumbnail (uses uploaded `photoUrl` as CSS background, else a placeholder pattern). While `report.analyzing`: spinner (`ppSpin`) + "Analyzing photo…". Once `report.analyzed`: "AI detected the tags below — edit anything that's off." plus three editable sections: **Species** (Dog/Cat/Cattle pill selector, `opt.select` → `setSpecies`), **Breed guess (AI)** (read-only text, `report.breedGuess`), **Condition tags** (multi-select chip pool from `TAG_POOL` = Limping/Visible wound/Skin disease/Malnourished/Roadkill risk/Hit by vehicle/Scared-aggressive; `tag.toggle` → `toggleTag`). Bottom CTA "Confirm & continue" (`t.confirmContinue`) → `reportNext` (step 3).

**Step 3 — Confirm location** (`isReportStep3`): `t.confirmLocation` = "Confirm location", `t.locationSub` = "We auto-tagged this from your device. Adjust the pin if it's off." Draggable map: click-to-place (`moveLocationPin`) or drag the pin (`startPinDrag`, tracks `mousemove`/`mouseup` on `window`); pin position stored as `locationX/Y` (0–100 %). Resolved address text is computed client-side by nearest-neighbor lookup against a fixed `NEARBY_ADDRESSES` list (8 named Kochi localities) using Euclidean distance on the x/y percentages — a stand-in for reverse geocoding. Bottom CTA "Looks right" (`t.looksRight`) → `reportNext` (step 4).

**Step 4 — Urgency + notes** (`isReportStep4`): `t.howUrgent` = "How urgent is it?", `t.urgentSub` = "This helps rescuers decide who responds first." Three urgency radio-cards: Critical ("Immediate danger — hit by vehicle, severe injury, roadblock."), Needs attention ("Visible issue but stable — wound, malnourished, sick."), Just monitoring ("Worth tracking, not urgent right now.") — `opt.select` → `setUrgencyDraft`. Optional note textarea (`t.addNote`, placeholder `t.notePlaceholder`) → `setNote`. Decorative "Record a voice note instead" row (`t.voiceNote`) — **no handler wired**, visual only/unimplemented. Bottom CTA "Submit report" (`t.submitReport`), disabled (gray) until an urgency is chosen → `submitReport` (builds a new case object, ID `C-{1043+caseCount}`, prepends to `state.cases`, advances to step 5).

**Step 5 — Success** (`isReportStep5`): green checkmark badge, "{t.caseReportedPrefix} {newCaseId} {t.caseReportedSuffix}" = "Case C-1046 reported", body `t.caseReportedBody` = "3 nearby volunteers and 1 shelter have been notified. You'll get updates as help is on the way." Two buttons: "View case" (`t.viewCase`) → `viewNewCase` (opens case detail for the new case), "Back to map" (`t.backToMap`) → `backToHomeFromReport`.

### 2.5 Case Detail (`isCaseDetail`)
Photo placeholder header (190px) with back chevron (→ `closeCaseDetail`, returns to `caseDetailFrom`), heart/favorite icon (decorative, no handler), and — only for NGO viewers — an "NGO view" badge chip. Below: urgency pill + "{id} · {time}", species title, "{breed} · reported by {reporter} · {distance}", condition tag chips, a small static map preview with a pin, optional quoted reporter note (only if `activeCase.note` truthy), and a **Status timeline** (4 steps: Reported/Claimed/In progress/Resolved, using `t.tabReported/tabClaimed/markInProgress/tabResolved` as labels) rendered as a connected dot-and-line list; completed steps get a filled teal dot + checkmark, the "Claimed" step's sub-label shows "by {claimedBy}".

Role-conditioned footer (mutually exclusive):
- **NGO view** (`activeCase.viewNgo`, true whenever `role==='ngo'`): "Assigned volunteer" card (badge + name, "Reassign" button → `reassignActiveCase`, cycles through a fixed name list `['Kavya R.','Arjun S.','Meera K.','You']`), "Internal notes" textarea (`ngoNoteDraft` → `setNgoNote`, placeholder "Visible to your team only…"), then either a disabled "Case resolved" pill (if `activeCase.resolved`) or a "Verify resolution" button (`activeCase.canVerify`, true when `status==='in_progress'`) → `verifyActiveCase` (only shows a toast — does not actually change status).
- **Read-only view** (`activeCase.viewReadonly`, true when role≠ngo AND the viewer is the original reporter of *their own* case): a disabled status pill showing `activeCase.readonlyLabel` ("Awaiting a rescuer" / "Case resolved" / "Contacted {claimedBy}"), plus — if `claimedByMe` — a chat icon button → `openChat`.
- **Default view** (`activeCase.viewDefault`, true for everyone else — i.e. reporter viewing someone else's case, or volunteer viewing any case): if `canClaim` (`status==='open'`) shows "I'll help" (`t.illHelp`) → `claimActiveCase` (sets status claimed, claimedBy 'You', toasts "Case claimed — reporter notified"); if `claimedByMe` shows a static "You're on this case" (`t.onThisCase`) pill + chat button (`openChat`); if `canAdvance` (claimed-by-me AND status is claimed or in_progress) shows an amber "Mark in progress"/"Mark resolved" button (`activeCase.advanceLabel`) → `advanceActiveCase` (claimed→in_progress→resolved); if `resolved` shows the disabled "Case resolved" pill.

### 2.6 My Cases / Case Queue (`isMyCases`)
Title (`myCasesTitle`): "My activity" (`t.myActivity`) for reporter/ngo-adjacent roles, "Case queue" for volunteers. Tab strip (`myTabs`, `tab.select` → `setMyTab`): Reporter/NGO sees Reported/Claimed/Resolved; Volunteer sees Nearby/Claimed/Resolved (Nearby = all open cases, not just the user's). List cards (`c.open` → `openCase`): urgency dot, species, time, id, distance, status pill, and a reporter-initial avatar badge (deterministic color from `personBadge()`, a 4-color palette hashed off the name's first character). Empty state: `t.nothingHere` = "Nothing here yet." when the filtered list is empty.

### 2.7 Shelters & Vets — List/Map toggle (`isShelters`)
Title `t.sheltersVets` = "Shelters & vets" + a segmented List/Map toggle (`t.listView`/`t.mapView`) → `setShelterView.list`/`.map`. **List view**: cards per shelter — teal circle initial avatar, name, star rating + review count + distance, open/closed hours line (colored green if open else amber), service tag chips (Vaccination/Sterilization/Emergency/Adoption); click → `openShelter(id)`. **Map view**: same dotted-grid map with teardrop pins per shelter, click → `openShelter(id)`.

### 2.8 Shelter Detail (`isShelterDetail`)
Photo-placeholder header (150px) + back chevron → `closeShelterDetail`. Name, rating/reviews/distance line, hours (colored), two action buttons "Call" (`t.call`, decorative — no handler) and "Directions" (`t.directions`, decorative — no handler), Services chip list (`t.services`), Address block (`t.address`, `activeShelter.address`).

### 2.9 Profile (`isProfile`)
72px avatar circle with initial, `profileName` ("Ravi Menon" default), role badge pill (`roleLabel`). Three impact-stat tiles (`impactStats`: 7 "Cases reported"/4 "Rescues claimed"/12 "Resolved total" — static demo numbers, not derived from `state.cases`). Badges row (3 static badge icons: "First Responder", "10 Rescues", "Night Owl" — decorative, not data-driven). Settings list: "Edit profile" (`t.editProfile`) → `openEditProfile`; "Notification preferences" (`t.notifPrefs`) with On/Off label → `toggleNotifPrefs`; "Language" (`t.language`) native `<select>` (English/മലയാളം/हिन्दी) → `setLanguage`; "Invite friends" (`t.inviteFriends`) → `inviteFriends` (toasts "Invite link copied to clipboard", no real share); "Log out" (`t.logOut`) → `logOut` (resets to onboarding screen, clears role). **Edit Profile modal** (`editProfileOpen`, bottom sheet): Name input (`editNameDraft` → `setProfileName`), Cancel → `closeEditProfile`, Save (`t.save`) → `saveProfile` (commits name, closes, toasts "Profile updated").

### 2.10 Notifications (`isNotifications`)
Back chevron → `goHome`. List of 5 seed notifications (`notifList`), each with a type icon (bell=new, heart=claim, chat-bubble=chat, checkmark=status), text, relative time, and an unread red dot. Unread rows have solid white background, read rows are translucent. No mark-as-read handler exists — the list is static seed data, unread state never changes.

### 2.11 Adopt Grid (`isAdopt`)
Title `t.readyAdoption` = "Ready for adoption" + sub `t.readyAdoptionSub`. 2-column card grid (`adoptList`): photo placeholder, name, "{breed} · {age}", distance; click → `openAdopt(id)`.

### 2.12 Adopt Detail (`isAdoptDetail`)
Photo-placeholder header (220px) + back → `closeAdoptDetail`. Name, chip row (age, gender, breed, conditionally "Vaccinated"/"Sterilized" badges), Story section (`t.story`, `activeAdopt.story`), CTA "Contact shelter" (`t.contactShelter`) → `expressInterest` (toasts "Interest sent to the shelter!", no real contact flow).

### 2.13 Chat (`isChat`)
Header: back → `closeChat` (returns to case detail), avatar "K", "Kavya R." / "Volunteer · re: {activeCase.id}" (hardcoded counterpart name — chat is not actually tied to whoever claimed the case). Scrollable message list (`chatMessages`, seeded with 3 messages), bubbles right-aligned/teal for `from:'me'`, left-aligned/white for `from:'them'`, pop-in animation (`ppPop`). Input row: text field (`chatInput` → `setChatInput`), send button → `sendChat` (appends the user message, then after 900ms auto-appends a canned reply "Got it, thanks for the update!" — a scripted echo-bot, not real messaging).

### 2.14 NGO Dashboard (`isNgoDashboard`)
Title "Dashboard" + org name "Kochi Animal Rescue Trust" (hardcoded, not tied to any org data model). 4 stat tiles: Open cases (`ngoStats.open`, red), Claimed (`ngoStats.claimed`, amber — counts both `claimed` and `in_progress`), Resolved (`ngoStats.resolved`, green), "Volunteers online" (hardcoded `8`, not real data). "Most urgent" list (`ngoUrgentList`: non-resolved cases, critical-first, top 4) — click → `openCase`.

### 2.15 NGO Queue (`isNgoQueue`)
Title "Case queue". Full case list (`ngoQueueList`, all cases regardless of status) — each row: urgency dot, species, id, status pill, "Assigned: {name|Unassigned}", and an Assign/Reassign button (`actionLabel`) → `c.assign` (stops propagation, force-assigns to hardcoded "Kavya R.", flips status open→claimed, toasts "Assigned to Kavya R."). Row click (elsewhere) → `openCase`.

### 2.16 Chrome: Tab bars, Toast, Modals
- **3 bottom tab bars**, mutually exclusive by role+screen (`showReporterTabBar`/`showVolunteerTabBar`/`showNgoTabBar`): Reporter = Map/Cases/Adopt/Shelters/Profile; Volunteer = Queue/Map/Shelters/Profile; NGO = Dashboard/Queue/Shelters/Profile. Active tab gets a pill background + teal icon color.
- **Toast** (`state.toast`): bottom-center dark pill, auto-dismisses after 2.2s (`showToast()` helper sets a timeout), fade-in animation (`ppFade`). Used by: claim-nearest, reassign, verify, save profile, toggle notif prefs, set language, invite friends, express interest, assign (NGO queue).
- **Capture-choice bottom sheet** (report step 1) and **Edit-profile bottom sheet** (profile) are the only two modal overlays; both are scrim + slide-up sheet, no animation keyframe of their own (rely on default paint).

**Total distinct top-level screens: 15** (Onboarding, Role Select, Home/Map, Report [1 screen housing 5 steps], Case Detail, My Cases/Queue, Shelters List/Map, Shelter Detail, Profile, Notifications, Adopt Grid, Adopt Detail, Chat, NGO Dashboard, NGO Queue), plus **5 report sub-steps**, **2 modal sheets**, **3 role-specific tab bars**, and **1 toast** as cross-cutting chrome.

---

## 3. Data model

Inferred from the seed constants (`CASES`, `SHELTERS`, `ADOPTS`, `NOTIFS`, `ONBOARD`, `TAG_POOL`, `NEARBY_ADDRESSES`, `URGENCY`, `STRINGS`) and the `state` shape in `class Component extends DCLogic`.

### Case (report)
```
{
  id: string                 // "C-1042" — client-generated as `C-${1043 + existingCount}` on submit; not globally unique-safe
  species: "Dog" | "Cat" | "Cattle"   // free enum in seed data, but report flow only offers these 3
  breed: string | null        // e.g. "Indie mix (AI guess)", "Domestic shorthair", "Street dog"; null seen for Cattle
  tags: string[]              // condition tags, from TAG_POOL: Limping, Visible wound, Skin disease, Malnourished, Roadkill risk, Hit by vehicle, Scared/aggressive
  urgency: "critical" | "attention" | "monitoring"
  status: "open" | "claimed" | "in_progress" | "resolved"
  claimedBy?: string          // volunteer display name, or "You"; absent/undefined when unclaimed
  reporter: string            // display name, or "You"
  distance: string            // pre-formatted, e.g. "0.4 km" — NOT a number, would need real geo distance calc in production
  time: string                // pre-formatted relative time, e.g. "12 min ago", "Yesterday", "Just now" — would be a real timestamp in production
  note: string                // free text, may be ""
  x: number, y: number        // 0–100, percentage position on the mock map canvas — needs replacing with real lat/lng
  photoUrl?: string           // only present transiently on drafts (blob: URL from file input), not in submitted case records (photo is not actually attached to submitted cases in this prototype)
}
```

### Report draft (in-progress submission, `state.report`)
```
{
  step: number                // 1-5
  photoTaken: boolean
  cameraActive: boolean
  photoUrl: string | null     // blob: URL
  analyzing: boolean          // true for ~1.1s after photo capture (fake AI delay)
  analyzed: boolean
  species: string             // editable AI guess, defaults "Dog"
  breedGuess: string          // AI text, not editable, defaults "Indie mix (AI guess)"
  tags: string[]              // editable AI guess, defaults ["Limping","Visible wound"]
  note: string
  urgency: string | null      // null until user picks one (gates submit button)
  locationX: number, locationY: number  // 0-100, defaults 50/46
}
```

### User / Role
```
{
  role: "reporter" | "volunteer" | "ngo" | null
  profileName: string          // default "Ravi Menon"
  languageCode: "en" | "ml" | "hi"
  notifPrefsOn: boolean
}
```
No auth/account data model exists at all — single implicit local user ("You"/"R" avatar initial), no login/signup screens.

### Shelter
```
{
  id: string
  name: string
  rating: number               // e.g. 4.6
  reviews: number               // count
  distance: string
  open: boolean
  hours: string                 // pre-formatted, e.g. "Open · Closes 8 PM", "Opens 9 AM tomorrow"
  services: string[]            // e.g. Vaccination, Sterilization, Emergency, Adoption
  address: string
  x: number, y: number          // map position %
}
```

### Adoptable animal
```
{
  id: string
  name: string
  age: string                   // pre-formatted, e.g. "~1.5 yrs", "~6 months"
  gender: "Male" | "Female"
  breed: string
  vaccinated: boolean
  sterilized: boolean
  distance: string
  story: string                 // free text bio
}
```

### Notification
```
{
  id: string
  type: "new" | "claim" | "chat" | "status"
  text: string                  // full pre-composed message, not templated fields
  time: string
  unread: boolean
}
```

### Chat message
```
{
  from: "me" | "them"
  text: string
  time: string                  // pre-formatted, e.g. "10:32 AM", "Now"
}
```
Chat is a single hardcoded thread per case (counterpart always "Kavya R."), not a real per-case/per-user message store.

### Onboarding slide
```
{ title: string /* \n for line break */, body: string }
```
(Localized overrides live in `STRINGS[lang].slide1/2/3` as `[title, body]` pairs.)

### i18n strings (`STRINGS[lang]`)
Flat key→string dictionary, ~55 keys per language (see §7).

---

## 4. State machine / flows

### 4.1 Report flow (linear, 5 steps, `state.report.step`)
1. **Capture** → user opens capture-choice sheet → picks camera (`cameraActive:true`) or gallery. Taking a photo (`takePhoto`) or choosing a gallery file (`handleFileChosen`) both: set `step:2`, `photoTaken:true`, `analyzing:true`, `analyzed:false`, then after a 1100ms `setTimeout` flip to `analyzing:false, analyzed:true` (simulated AI inference — no real vision API call exists).
2. **AI tag confirm** → user can edit species (radio) and toggle condition tags (multi-select chip toggle over `TAG_POOL`); breed guess is read-only. "Confirm & continue" → `step:3`. (Back button here decrements to step 1.)
3. **Location** → drag or click-to-place a pin on a mock grid map; address text is derived by nearest-neighbor match against 8 hardcoded Kochi addresses (not real reverse geocoding). "Looks right" → `step:4`.
4. **Urgency + notes** → user must pick one of 3 urgency radios (submit disabled until chosen); optional note textarea; "voice note" row is decorative/non-functional. "Submit report" → builds the new case object (id `C-{1043+count}`, prepends to `state.cases`, uses whatever species/tags/urgency/note were set, status forced to `"open"`, reporter forced to `"You"`, distance/x/y hardcoded to `"0.2 km"`/50/50 regardless of the pin the user placed — **the location step's pin position is never actually read into the submitted case**), advances to `step:5`.
5. **Success** → shows the new case ID, links to view it (`openCase`) or return to map (`backToHomeFromReport`, back to `screen:'home'`).

Back navigation (`reportBack`): steps 2–4 decrement by 1; step 1 exits straight to `screen:'home'` (there's no "step 0"); step 5 has no back button (only the two explicit exits).

### 4.2 Case status lifecycle
`open → claimed → in_progress → resolved` (linear, no reject/reopen path exists in this prototype).

| Transition | Trigger | Who can trigger (per role logic) |
|---|---|---|
| — → `open` | `submitReport()` | Anyone (reporter role) submitting a new report |
| `open` → `claimed` | `claimActiveCase()` (case detail "I'll help" button, only rendered when `canClaim` = `status==='open'`) | Any non-NGO viewer who is not the case's own reporter (`activeCase.viewDefault`) — in practice, volunteers |
| `open` → `claimed` | `fabAction()` map FAB shortcut | Volunteer role only (auto-picks nearest open case by parsed distance) |
| `open` → `claimed` | `c.assign` in NGO Queue | NGO role, force-assigns to hardcoded "Kavya R." |
| `claimed` → `in_progress` | `advanceActiveCase()` ("Mark in progress" button, shown when `canAdvance` = `claimedBy==='You' && status in {claimed,in_progress}`) | Only the volunteer who claimed it as "You" |
| `in_progress` → `resolved` | `advanceActiveCase()` again ("Mark resolved") | Same as above — same button relabels via `advanceLabel` |
| (no-op, cosmetic only) | `verifyActiveCase()` (NGO "Verify resolution" button, shown when `canVerify` = `status==='in_progress'`) | NGO role — **does not change status**, only shows a toast "Resolution verified"; the real resolve transition is still owned by the claiming volunteer's `advanceActiveCase` |
| any → reassigned claimant | `reassignActiveCase()` (NGO-only "Reassign" button) | NGO role — cycles `claimedBy` through `['Kavya R.','Arjun S.','Meera K.','You']`; if status was `open` it also bumps it to `claimed` |

Note the logical gap: NGOs can "Verify resolution" only while status is `in_progress` (i.e. before the volunteer has actually marked it resolved) — the copy/flow implies verification should gate the final resolved state, but the code does not actually block or perform that transition; it's cosmetic in this prototype and would need real backend semantics in production (e.g. NGO verification should probably be the actual trigger for `in_progress → resolved`, or a separate `pending_verification` status should exist).

### 4.3 Role-based Case Detail view logic (`renderVals()`)
Computed per-render from `state.role` and the active case's `reporter`/`claimedBy`/`status`:
```
isNgoRole            = role === 'ngo'
isReporterOwnCase    = role === 'reporter' && activeCase.reporter === 'You'
activeCase.viewNgo      = isNgoRole
activeCase.viewReadonly = !isNgoRole && isReporterOwnCase
activeCase.viewDefault  = !isNgoRole && !isReporterOwnCase   // i.e. reporter-viewing-others'-case, OR any volunteer
activeCase.canClaim     = status === 'open'
activeCase.claimedByMe  = claimedBy === 'You' && status !== 'resolved'
activeCase.canAdvance   = claimedBy === 'You' && (status === 'claimed' || status === 'in_progress')
activeCase.resolved     = status === 'resolved'
activeCase.canVerify    = status === 'in_progress'   // gated only by status, NOT by role — but only rendered inside the viewNgo branch, so effectively NGO-only
```
Exactly one of `viewNgo` / `viewReadonly` / `viewDefault` is true at a time (mutually exclusive footer panels in §2.5). Because `viewNgo` is checked purely on `role`, an NGO user viewing *any* case (including one "claimedByMe" would never happen for an NGO since NGOs never claim) always sees the NGO panel — there's no separate "NGO viewing a case they personally are following" state.

### 4.4 Map pin filtering (Home screen)
```
filteredCases = state.cases
  .filter(c => c.status !== 'resolved')
  .filter(c => role !== 'volunteer' || c.status === 'open')   // volunteers only ever see open cases on the map
  .filter(c => speciesFilter === 'All' || c.species === speciesFilter)
  .filter(c => urgencyFilter === 'All' || c.urgency === urgencyFilter)
```
Pins pulse (`ppPulse`) only when `urgency === 'critical' && status === 'open'`.

### 4.5 My Cases / Queue tab filtering
```
nearby   (volunteer only): status === 'open'
reported (reporter/ngo default tab): reporter === 'You'
claimed:  claimedBy === 'You' && status !== 'resolved'
resolved: status === 'resolved'
```

---

## 5. Every event handler

Grouped by area; each is a bound arrow-function class field (or method) on `Component extends DCLogic`, called directly from `onClick`/`onChange`/`onMouseDown` bindings in the template (many are wrapped in small per-item factory functions inside `renderVals()`, e.g. `chip.select`, `c.open` — those are noted inline).

**Navigation / lifecycle**
- `go(screen)` — internal helper, `setState({screen})`.
- `goHome`, `goNotifications`, `goNgoDashboard`, `goNgoQueue` — direct screen switches.
- `goMyCases`/`goAdopt`/`goShelters`/`goProfile` — inline in `renderVals()` as `() => this.go('x')`, bound to tab-bar icons.
- `skipOnboarding` — jumps straight to `roleSelect`.
- `onboardNext` — advances `onboardIndex`, or on last slide moves to `roleSelect`.
- `pickRole(r)` — sets `state.role` only (does not navigate).
- `confirmRole` — navigates based on `state.role` (ngo→dashboard, volunteer→myCases, reporter→home).
- `logOut` — resets `screen:'onboarding'`, `onboardIndex:0`, `role:null` (no real session/auth to clear).

**Home / map**
- `setSpeciesFilter(v)`, `setUrgencyFilter(v)` — set filter, clear `selectedPinId`.
- `selectPin(id)` — sets `selectedPinId` (shows the popup card).
- `fabAction` — role-dependent: volunteer auto-claims nearest open case (or toasts none available); others call `startReport()`.
- `startReport` — resets `state.report` to a fresh draft, `screen:'report'`.

**Report flow**
- `reportBack` — step-aware back (see §4.1).
- `openCaptureChoice`/`closeCaptureChoice` — toggle the capture-choice sheet.
- `chooseTakePhoto` — closes sheet, sets `report.cameraActive:true`.
- `chooseGallery` — closes sheet, triggers hidden file input click via `triggerGalleryPick`.
- `triggerGalleryPick` — imperatively `.click()`s the `galleryInputRef` file input.
- `stopPropagation(e)` — generic `e.stopPropagation()`, used so clicking inside a sheet doesn't close it via the scrim's click handler.
- `shutterAction` — if camera active, calls `takePhoto()`; else opens capture choice.
- `takePhoto` — sets step 2 + fake-analyzing sequence (see §4.1).
- `handleFileChosen(e)` — reads chosen file, creates a blob URL, same fake-analyzing sequence as `takePhoto`.
- `setPinFromEvent(clientX, clientY, rect)` — internal helper, clamps pointer position to 0–100% and writes `report.locationX/Y`.
- `moveLocationPin(e)` — click-to-place using `setPinFromEvent`.
- `startPinDrag(e)` — begins a drag: attaches `window` `mousemove`/`mouseup` listeners that call `setPinFromEvent` and clean themselves up on mouseup.
- `setSpecies(sp)` — sets `report.species`.
- `toggleTag(tag)` — adds/removes a tag from `report.tags`.
- `setNote(e)` — sets `report.note`.
- `setUrgencyDraft(u)` — sets `report.urgency`.
- `reportNext` — increments `report.step` by 1 (used by steps 2 and 3's continue buttons).
- `submitReport` — validates `report.urgency` is set, builds and prepends the new case, sets `newCaseId`, advances to step 5.
- `viewNewCase` — opens case detail for `newCaseId`.
- `backToHomeFromReport` — `screen:'home'`.

**Case detail**
- `openCase(id)` — sets `activeCaseId`, `screen:'caseDetail'`, and records `caseDetailFrom` (the screen navigated from, so back returns correctly — but only set once per navigation, doesn't overwrite if already inside caseDetail, e.g. via chat back-and-forth).
- `closeCaseDetail` — returns to `caseDetailFrom` (defaults `'home'`).
- `claimActiveCase` — open→claimed, claimedBy 'You', toast.
- `advanceActiveCase` — claimed→in_progress→resolved (no-op if already resolved or not claimed).
- `reassignActiveCase` — NGO-only, cycles claimant name, may bump open→claimed, toast "Reassigned".
- `setNgoNote(e)` — sets `ngoNoteDraft` (never persisted to the case object — internal notes are not actually saved per-case).
- `verifyActiveCase` — toast only, no state change (see §4.2 gap).
- `openChat` — `screen:'chat'`.

**Chat**
- `closeChat` — back to `screen:'caseDetail'`.
- `setChatInput(e)` — sets `chatInput`.
- `sendChat` — appends a "me" message (if non-empty, trimmed), clears input, then after 900ms appends a canned "them" auto-reply.

**My Cases / Queue**
- `setMyTab(t)` — sets `state.myTab`.
- Per-row `c.open` (in `myCasesList`/`ngoUrgentList`/`ngoQueueList`) → `openCase(c.id)`.
- `c.assign` (NGO queue rows only) — stops propagation, force-assigns to "Kavya R.", flips open→claimed, toast.

**Shelters**
- `setShelterView.list` / `setShelterView.map` — toggle `state.shelterView`.
- `s.open`/`p.open` (per shelter row/pin) → `openShelter(id)`.
- `openShelter(id)` — sets `activeShelterId`, `screen:'shelterDetail'`.
- `closeShelterDetail` — `screen:'shelters'`.
- "Call"/"Directions" buttons on Shelter Detail — **no handler bound**, purely decorative in this prototype.

**Adopt**
- `a.open` (per card) → `openAdopt(id)`.
- `openAdopt(id)` — sets `activeAdoptId`, `screen:'adoptDetail'`.
- `closeAdoptDetail` — `screen:'adopt'`.
- `expressInterest` — toast "Interest sent to the shelter!", no real contact/message sent.

**Notifications**
- `goNotifications`/`goHome` only — no per-notification click handler, no mark-as-read action exists at all.

**Profile**
- `openEditProfile`/`closeEditProfile` — toggle modal, seeding `editNameDraft` from current `profileName` on open.
- `setProfileName(e)` — sets `editNameDraft`.
- `saveProfile` — commits `editNameDraft` → `profileName` (falls back to existing name if draft is empty), closes modal, toast.
- `toggleNotifPrefs` — flips `notifPrefsOn`, toast reflecting old→new state.
- `setLanguage(e)` — sets `languageCode`, toast naming the language in its own script.
- `inviteFriends` — toast only, no real share sheet/link generation.
- `logOut` — see Navigation above.

**Misc/internal (not directly template-bound but used by the above)**
- `showToast(msg)` — sets `state.toast`, clears any previous timeout, auto-clears after 2200ms.

---

## 6. Visual design system

### Colors (hex/rgba as used in the markup)
| Role | Value |
|---|---|
| App background (cream) | `#fbf6ea` |
| Outer canvas background | `#e7ecdf` |
| Onboarding dark bg | `#163832` |
| Primary/brand teal (buttons, active states, teal pins, links) | `#1f5d50` (hover darker: `#163832` for `a:hover`) |
| Primary text (near-black green) | `#17302b` |
| Muted text | `rgba(23,48,43,0.4 / .45 / .5 / .55 / .6)` (opacity ramps used contextually for hierarchy) |
| Hairline borders / subtle fills | `rgba(23,48,43,0.06 / .08 / .1 / .12 / .15)` |
| Critical/danger (urgency, unread dot, roadkill) | `#de5b3e`, bg `#fbeae5` |
| Attention/warning (urgency, claimed status, advance button, star rating) | `#c9860f` / `#e3a13a`, bg `#fbf0dc` |
| Monitoring/success (urgency, resolved status, checkmarks, vaccinated/sterilized badges) | `#3f8a5e` / `#4e9c6d` / `#2e6b4c`, bg `#e7f2ec` |
| In-progress status (blue) | `#3a6ea5`, bg `#e2ecf5` |
| Person-badge palette (4-color hash rotation) | `['#1f5d50', '#c9860f', '#3a6ea5', '#8a4fae']` |
| Map canvas fill | `#dfe6d4` (with a subtle grid pattern of `rgba(23,48,43,0.06)` lines every 24-26px) |
| Chat background | `#f2ede0` |
| Toast bg/text | `#17302b` / `#fbf6ea` |
| White surfaces (cards) | `#fff` |

### Typography
- Primary font: **"Plus Jakarta Sans"** (Google Fonts, weights 400/500/600/700/800) for all app content.
- iOS chrome (device frame only, not app content): system font stack `-apple-system, "SF Pro"/"SF Compact", system-ui`.
- Monospace accents (camera viewfinder labels, "LIVE" badge context, id-code strings): `ui-monospace, monospace`.
- Scale observed: 10.5px (tab labels) · 11–12px (meta text, chips) · 13–14.5px (body) · 15–16px (buttons, emphasis) · 18–22px (section/screen titles) · 26px (onboarding headline) · 34px (iOS large-title chrome, unused in-app).
- Weights: 600 (semi-bold labels/buttons), 700 (headings, card titles), 800 (screen titles, onboarding headline, stat numbers).

### Spacing / shape
- Screen side padding: 20px (16px on some detail headers).
- Top padding to clear the simulated status bar: 56–64px.
- Border radius: 26px pill CTAs (52px-tall buttons), 20–24px cards/sheets/map containers, 14–18px smaller cards/chips, 9–14px icon tiles, 50% for avatars/dots/FAB.
- Bottom tab bar reserves 86–106px of scroll padding at the bottom of scrollable screens so content isn't hidden behind it.
- Standard gap rhythm: 6/8/10/12/14/16/20px.

### Icon set (all inline SVG, `viewBox="0 0 24 24"`, stroke-based unless noted, 1.6–2.4px stroke width)
- **Home** (roof + door) — nav "Map" tab.
- **Cases/clipboard** (rounded rect + small tab + two horizontal lines) — nav "Cases"/"Queue" tab and my-cases card thumbnails.
- **Adopt/heart** (dog/heart silhouette path, also reused as the Volunteer role icon and "Volunteer" badge) — nav "Adopt" tab, volunteer role select icon.
- **Shelters/location pin** (teardrop + inner circle) — nav "Shelters" tab, NGO role icon, map pins, address rows.
- **Profile/person** (circle head + shoulders arc) — nav "Profile" tab.
- **Bell** (notification bell with clapper gap) — notifications icon, home header.
- **Chat bubble** (rect speech bubble with tail) — chat icon buttons, chat notification icon.
- **Checkmark-in-circle** — resolved status, success screen, "10 Rescues" badge, chat notification "status" icon.
- **Camera** (rounded rect body + circle lens) — reporter role icon, photo capture icons, "photo:" tag on case detail header.
- **Back chevron** (`<` path) — every back button.
- **Plus** — reporter FAB (start report).
- **Checkmark (loose, not circled)** — volunteer FAB (claim nearest).
- **Star** (5-point, filled) — shelter/rating displays.
- **Microphone-ish capsule + arc** — "Record a voice note" row (decorative only).
- **Gallery/mountains-in-frame icon** — "Upload from gallery" choice sheet row.
- **Phone handset** — Shelter Detail "Call" button.
- **Compass/navigation arrow** — Shelter Detail "Directions" button.
- **Globe** (circle + meridian lines) — Language settings row.
- **Two-people-plus** — Invite friends row.
- **Logout arrow** (box with arrow exiting) — Log out row.
- **Crescent moon** — "Night Owl" profile badge.
- **Dashboard bars** (3 ascending rects) — NGO Dashboard tab icon.
- **Paper airplane** (crossed diagonal strokes) — Chat send button.

### Animation keyframes (defined once in the top-level `<style>` block)
| Keyframe | Effect | Used where |
|---|---|---|
| `ppSpin` | 360° rotation, linear infinite | AI-analyzing spinner (report step 2) |
| `ppPop` | fade+slide-up+scale in (0.98→1, translateY 6→0) | Selected map-pin popup card; each chat bubble appearing |
| `ppFade` | fade + slide up from +8px, transform origin `translate(-50%, y)` | Toast notification |
| `ppPulse` | scale 1→2.4 with fading opacity, `ease-out infinite` | Critical + open case map pins (urgency alert ripple) |
| `ppBreath` | box-shadow ring pulses outward and fades | FAB (floating action button) idle "breathing" glow |
| `ppBlob` | translate + scale drift loop | Decorative background blobs on the onboarding illustration placeholder |
| `ppDot` | opacity 1↔0.35 blink | Unread red dot (home bell icon); "LIVE" recording dot in camera viewfinder |

Standard transitions (not keyframed, just CSS `transition`): `transform`/`box-shadow` ease on hover/active for buttons and cards (`style-hover`/`style-active` DC pseudo-class bindings), `background`/`border-color` ease for selection state changes on filter chips and role cards.

---

## 7. Copy / i18n

`STRINGS` defines **three full languages**: `en` (English), `ml` (Malayalam, മലയാളം), `hi` (Hindi, हिन्दी) — matching the app's Kochi/Kerala setting. Each language object is a flat dictionary of the same ~55–58 keys (English has a few extra keys with no ml/hi counterpart needed since some UI, like NGO Dashboard/Queue headings and shelter/case labels such as "Reassign", "NGO view", "Volunteers online", are hardcoded English strings in the template rather than routed through `t` — these would need to be added to the strings table for a real i18n rollout). Selected via the Profile screen's native `<select>` (`languageCode` state, options en/ml/hi), applied live across the whole app on next render (no reload). Onboarding slide copy has its own per-language override keys (`slide1`/`slide2`/`slide3`, each a `[title, body]` pair) layered on top of the language-agnostic `ONBOARD` array (which supplies the English fallback/placeholder text and drives the dot count).

Not covered by `t` (English-only, hardcoded in the template — flagged as i18n gaps for the rebuild):
- NGO Dashboard/Queue screen titles ("Dashboard", "Case queue", "Most urgent", org name "Kochi Animal Rescue Trust", "Volunteers online")
- Case Detail NGO panel labels ("NGO view", "Assigned volunteer", "Reassign", "Internal notes", "Verify resolution")
- Chat header ("Volunteer · re: …")
- Profile section header "Badges" and the three static badge names/labels
- Report step 2/3 helper copy ("AI detected the tags below…", "Species", "Breed guess (AI)", "Condition tags", "Drag the pin, or tap the map, to adjust")
- Urgency option descriptions on report step 4 ("Immediate danger — …", etc.)
- All toast messages (constructed ad hoc in handler code, e.g. `'Claimed nearest case: ' + nearest.id`)

For the production rebuild, recommend fully centralizing every user-visible string (including the above gaps and all toast copy) into the `t`/`STRINGS` structure so language switching is complete, and replacing the hardcoded English fallback logic in `onboardSlide` with a guaranteed-present key per language.
