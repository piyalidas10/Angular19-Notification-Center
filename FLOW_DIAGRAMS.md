# 🔔 Notification Center — Flow Diagrams

> All diagrams use [Mermaid](https://mermaid.js.org/) syntax.  
> Render in GitHub, VS Code (Markdown Preview Mermaid Support), or [mermaid.live](https://mermaid.live).

---

## Table of Contents

1. [Overall Frontend Architecture](#1-overall-frontend-architecture)
2. [Application Bootstrap Flow](#2-application-bootstrap-flow)
3. [Component Tree & Ownership](#3-component-tree--ownership)
4. [NotificationService — Signal State Flow](#4-notificationservice--signal-state-flow)
5. [WebsocketService — Real-Time Data Flow](#5-websocketservice--real-time-data-flow)
6. [ToastService — Queue Flow](#6-toastservice--queue-flow)
7. [NotificationBell — Component Logic Flow](#7-notificationbell--component-logic-flow)
8. [NotificationDrawer — Component Logic Flow](#8-notificationdrawer--component-logic-flow)
9. [NotificationSearch + Filter + Sort — Pipeline Flow](#9-notificationsearch--filter--sort--pipeline-flow)
10. [NotificationList + Item — Render & Interaction Flow](#10-notificationlist--item--render--interaction-flow)
11. [Toast Component — Display Flow](#11-toast-component--display-flow)
12. [Dashboard — Computed Signal Flow](#12-dashboard--computed-signal-flow)
13. [Full User Interaction Sequence — Mark Read](#13-full-user-interaction-sequence--mark-read)
14. [Full User Interaction Sequence — Delete](#14-full-user-interaction-sequence--delete)
15. [Full User Interaction Sequence — New Notification (WebSocket)](#15-full-user-interaction-sequence--new-notification-websocket)
16. [filteredNotifications Computed Signal — Decision Flow](#16-filterednotifications-computed-signal--decision-flow)
17. [HTTP REST API Interaction Flow](#17-http-rest-api-interaction-flow)
18. [Angular Change Detection & Signal Reactivity Map](#18-angular-change-detection--signal-reactivity-map)

---

## 1. Overall Frontend Architecture

High-level picture of every layer and how they connect.

```mermaid
graph TB
    subgraph ENTRY["Entry Layer"]
        MAIN["main.ts\nbootstrapApplication()"]
        APP_CFG["app.config.ts\nprovideRouter()\nprovideHttpClient()\nprovideAnimationsAsync()"]
    end

    subgraph ROUTING["Routing Layer — app.routes.ts"]
        ROUTE_ROOT["/ → redirect /dashboard"]
        ROUTE_DASH["'/dashboard' → loadComponent()\n★ Lazy Loaded Chunk"]
    end

    subgraph CORE["Core Layer (providedIn: 'root')"]
        NS["NotificationService\n──────────────────\nsignal: notifications[]\nsignal: isDrawerOpen\nsignal: activeFilter\nsignal: searchQuery\nsignal: selectedIds\ncomputed: unreadCount\ncomputed: criticalCount\ncomputed: filteredNotifications\ncomputed: stats"]
        WS["WebsocketService\n──────────────────\nio() Socket.IO client\nlisten<T>(event) → Observable\nonNotificationNew()\nonNotificationDelete()\nonNotificationRead()\nonNotificationReadAll()"]
        TS["ToastService\n──────────────────\nsignal: toasts[]\nshow(options)\ndismiss(id)\nclear()"]
    end

    subgraph SHARED["Shared Layer"]
        MODEL["notification.model.ts\nNotification\nNotificationResponse\nToast\nToastType"]
        CAT_ENUM["notification-category.enum.ts\nCATEGORY_CONFIG\n8 categories × {icon,color,label}"]
        PRI_ENUM["priority.enum.ts\nPRIORITY_CONFIG\n4 levels × {label,color,order}"]
        PIPE_TIME["TimeAgoPipe\ntransform(date) → '2 min ago'"]
        PIPE_CAT["CategoryLabelPipe\ntransform(cat) → 'Order'"]
        DIR_PRI["PriorityBorderDirective\n[appPriorityBorder]\nsets border-left color"]
        DIR_CAT["CategoryColorDirective\n[appCategoryColor]\nsets --category-color CSS var"]
    end

    subgraph FEATURES["Features Layer"]
        DASH["DashboardComponent\n──────────────────\ncomputed: categoryStats\ncomputed: recentActivity"]

        subgraph NC["Notification Center Components"]
            BELL["NotificationBellComponent\nChangeDetection.OnPush\nAnimations: bellRing, badgePulse"]
            DRAWER["NotificationDrawerComponent\nAnimations: slideIn, fade"]
            SEARCH["NotificationSearchComponent\nFormsModule [(ngModel)]"]
            FILTER["NotificationFilterComponent\n7 filter chips"]
            LIST["NotificationListComponent"]
            ITEM["NotificationItemComponent\n@Input notification\n@Output markRead/delete/toggleSelect"]
            TOAST["ToastComponent\nAnimations: slideIn"]
        end
    end

    MAIN --> APP_CFG
    APP_CFG --> ROUTING
    ROUTING --> DASH
    DASH --> BELL
    DASH --> DRAWER
    DASH --> TOAST
    DRAWER --> SEARCH
    DRAWER --> FILTER
    DRAWER --> LIST
    LIST --> ITEM
    ITEM --> DIR_PRI
    ITEM --> PIPE_TIME
    NS --> WS
    NS --> TS
    NS -.->|"inject()"| DASH
    NS -.->|"inject()"| BELL
    NS -.->|"inject()"| DRAWER
    NS -.->|"inject()"| SEARCH
    NS -.->|"inject()"| FILTER
    NS -.->|"inject()"| LIST
    TS -.->|"inject()"| TOAST
```

---

## 2. Application Bootstrap Flow

Sequence from `main.ts` load to first data appearing on screen.

```mermaid
sequenceDiagram
    participant Browser
    participant main.ts
    participant AppConfig
    participant AppComponent
    participant Router
    participant DashboardComponent
    participant NotificationService
    participant Backend

    Browser->>main.ts: Load Angular bundle
    main.ts->>AppConfig: bootstrapApplication(AppComponent, appConfig)
    AppConfig->>AppConfig: provideRouter(routes)
    AppConfig->>AppConfig: provideHttpClient(withFetch())
    AppConfig->>AppConfig: provideAnimationsAsync()
    AppConfig->>NotificationService: Instantiate (providedIn: root)
    Note over NotificationService: constructor() runs:<br/>• ws.onNotificationNew().subscribe()<br/>• ws.onNotificationRead().subscribe()<br/>• ws.onNotificationReadAll().subscribe()<br/>• ws.onNotificationDelete().subscribe()<br/>• searchSubject.pipe(debounce,distinct).subscribe()
    AppConfig->>AppComponent: Mount <app-root>
    AppComponent->>NotificationService: ngOnInit() → loadNotifications()
    NotificationService->>Backend: GET /notifications?page=1&limit=20
    Backend-->>NotificationService: { notifications[], total, page, totalPages }
    NotificationService->>NotificationService: notifications.set(res.notifications)
    Note over NotificationService: Computed signals auto-recalculate:<br/>unreadCount, criticalCount,<br/>filteredNotifications, stats
    AppComponent->>Router: Navigate to /dashboard
    Router->>DashboardComponent: loadComponent() [lazy chunk]
    DashboardComponent->>Browser: Render stats, activity, bell
```

---

## 3. Component Tree & Ownership

Shows parent → child relationships and which service each component injects.

```mermaid
graph TD
    A["AppComponent\n<app-root>\ninjects: NotificationService\ncalls: loadNotifications()"]
    A --> B["RouterOutlet\n→ /dashboard"]
    B --> C["DashboardComponent\ninjects: NotificationService\ncomputed: categoryStats, recentActivity"]

    C --> D["NotificationBellComponent\ninjects: NotificationService\nreads: unreadCount (computed)\nanimations: bellRing, badgePulse"]

    C --> E["NotificationDrawerComponent\ninjects: NotificationService\nreads: isDrawerOpen signal\nanimations: slideIn, fade\nactions: markAllRead, deleteAll,\n         deleteSelected, selectAll"]

    C --> F["ToastComponent\ninjects: ToastService\nreads: toasts signal\nanimation: slideIn"]

    E --> G["NotificationSearchComponent\ninjects: NotificationService\nstate: searchQuery (local)\ncalls: service.setSearch()\ncalls: service.setSort()"]

    E --> H["NotificationFilterComponent\ninjects: NotificationService\nreads: activeFilter signal\ncalls: service.setFilter()"]

    E --> I["NotificationListComponent\ninjects: NotificationService\nreads: filteredNotifications (computed)\ncalls: markAsRead, deleteNotification,\n       toggleSelected, loadMore"]

    I --> J["NotificationItemComponent\n@Input: notification, selected\n@Output: markRead, delete, toggleSelect\nuses: TimeAgoPipe\nuses: PriorityBorderDirective\nuses: CATEGORY_CONFIG, PRIORITY_CONFIG"]

    style D fill:#dbeafe,stroke:#3b82f6
    style E fill:#ede9fe,stroke:#7c5cd8
    style F fill:#fef3c7,stroke:#f59e0b
    style G fill:#d1fae5,stroke:#10b981
    style H fill:#d1fae5,stroke:#10b981
    style I fill:#d1fae5,stroke:#10b981
    style J fill:#fee2e2,stroke:#ef4444
```

---

## 4. NotificationService — Signal State Flow

How signals, computed signals, and effects relate to each other.

```mermaid
graph LR
    subgraph SIGNALS["Writable Signals (source of truth)"]
        S1["notifications\nsignal&lt;Notification[]&gt;([])"]
        S2["isDrawerOpen\nsignal(false)"]
        S3["activeFilter\nsignal('all')"]
        S4["activeSort\nsignal('latest')"]
        S5["searchQuery\nsignal('')"]
        S6["selectedIds\nsignal(new Set())"]
        S7["isLoading\nsignal(false)"]
        S8["currentPage / totalPages\ntotalCount signals"]
    end

    subgraph COMPUTED["Computed Signals (derived, read-only)"]
        C1["unreadCount\nnotifications().filter(!read).length"]
        C2["criticalCount\nnotifications().filter(critical && !read).length"]
        C3["filteredNotifications\n① clone notifications()\n② apply activeFilter()\n③ apply searchQuery()\n④ apply activeSort()\n→ returns sorted/filtered list"]
        C4["stats\n{ total, unread, critical, high,\nbyCategory: {order,payment,...} }"]
    end

    subgraph EFFECTS["Effects (side effects)"]
        E1["effect()\nwatches criticalCount()\n→ reserved for sound/alert"]
    end

    subgraph RXJS["RxJS Bridge (search)"]
        R1["searchSubject\nBehaviorSubject&lt;string&gt;"]
        R2["pipe(\n  debounceTime(300),\n  distinctUntilChanged()\n)"]
        R3["subscribe(q =>\n  searchQuery.set(q))"]
    end

    S1 --> C1
    S1 --> C2
    S1 --> C3
    S1 --> C4
    S3 --> C3
    S4 --> C3
    S5 --> C3
    C2 --> E1
    R1 --> R2 --> R3 --> S5

    style C1 fill:#dbeafe
    style C2 fill:#fee2e2
    style C3 fill:#d1fae5
    style C4 fill:#ede9fe
    style E1 fill:#fef3c7
```

---

## 5. WebsocketService — Real-Time Data Flow

From Socket.IO connection to Angular Signal update.

```mermaid
sequenceDiagram
    participant Backend as Node.js Backend<br/>(Socket.IO Server)
    participant WS as WebsocketService<br/>io() client
    participant NS as NotificationService<br/>(subscriber)
    participant SIG as notifications Signal
    participant COMP as Components<br/>(auto re-render)

    Note over WS: constructor():<br/>io(wsUrl, { transports: ['websocket','polling'],<br/>reconnection: true, attempts: 5 })

    Backend-->>WS: emit('notification:new', notification)
    WS->>NS: onNotificationNew() Observable.next(notification)
    NS->>SIG: notifications.update(list => [notification, ...list])
    NS->>NS: totalCount.update(c => c + 1)
    NS->>NS: toast.show({ title, message, type })
    SIG-->>COMP: Computed signals recalculate → view updates

    Backend-->>WS: emit('notification:read', notification)
    WS->>NS: onNotificationRead() Observable.next(notification)
    NS->>SIG: notifications.update(list =><br/>list.map(n => n.id===id ? {...n, read:true} : n))
    SIG-->>COMP: unreadCount recomputed → badge updates

    Backend-->>WS: emit('notification:read-all')
    WS->>NS: onNotificationReadAll() Observable.next()
    NS->>SIG: notifications.update(list =><br/>list.map(n => ({...n, read:true})))
    SIG-->>COMP: unreadCount → 0, badge disappears

    Backend-->>WS: emit('notification:delete', { id })
    WS->>NS: onNotificationDelete() Observable.next({ id })
    NS->>SIG: notifications.update(list =><br/>list.filter(n => n.id !== id))
    SIG-->>COMP: filteredNotifications shrinks → item removed

    Backend-->>WS: emit('notification:delete', { all: true })
    WS->>NS: onNotificationDelete() Observable.next({ all: true })
    NS->>SIG: notifications.set([])
    SIG-->>COMP: Empty state shown
```

---

## 6. ToastService — Queue Flow

```mermaid
flowchart TD
    A["Caller: toast.show({ message, type, title?, duration? })"]
    A --> B["Generate id = 'toast-{++counter}'"]
    B --> C["Create Toast object\n{ id, message, type, title,\nduration: options.duration ?? 4000 }"]
    C --> D["toasts.update(list => [...list, toast])\n→ Signal append to queue"]
    D --> E{duration > 0?}
    E -- Yes --> F["setTimeout(() => dismiss(id), duration)\nDefault: 4000ms"]
    E -- No --> G["Toast stays until manual close"]
    F --> H["After timeout: dismiss(id)"]
    H --> I["toasts.update(list =>\nlist.filter(t => t.id !== id))"]
    I --> J["ToastComponent re-renders\n@for iterates toasts signal\n:leave animation plays 300ms"]

    K["User clicks ✕ button\n(toast.component.ts: onClose)"]
    K --> L["toastService.dismiss(id)"]
    L --> I

    style D fill:#d1fae5,stroke:#10b981
    style I fill:#fee2e2,stroke:#ef4444
    style J fill:#dbeafe,stroke:#3b82f6
```

---

## 7. NotificationBell — Component Logic Flow

```mermaid
flowchart TD
    A["Component mounts\nngOnInit()"]
    A --> B["prevCount = notificationService.unreadCount()"]
    B --> C["window.setInterval(500ms poll)"]
    C --> D["count = unreadCount()"]
    D --> E{count > prevCount?}
    E -- Yes --> F["ringState.set('ring')\npulseState.set('pulse')"]
    F --> G["[@bellRing] animation plays\n6-step keyframe rotate"]
    F --> H["[@badgePulse] animation plays\nscale 1 → 1.4 → 1"]
    G --> I["(@bellRing.done) → onRingDone()\nringState.set('idle')"]
    H --> J["(@badgePulse.done) → onPulseDone()\npulseState.set('idle')"]
    E -- No --> K["prevCount = count — loop continues"]

    L["User clicks bell button\nonBellClick()"]
    L --> M["notificationService.toggleDrawer()\nisDrawerOpen.update(v => !v)"]

    N["unreadCount() > 0?"]
    N -- Yes --> O["@if renders badge span\nshows count (max '99+')"]
    N -- No --> P["badge hidden"]

    Q["ngOnDestroy()"]
    Q --> R["window.clearInterval(intervalId)"]
```

---

## 8. NotificationDrawer — Component Logic Flow

```mermaid
flowchart TD
    A["@if (service.isDrawerOpen())"]
    A -- true --> B["Render overlay div\n[@fade] opacity 0→1 (300ms)"]
    A -- true --> C["Render .drawer panel\n[@slideIn] translateX(100%)→0 (300ms ease-out)"]
    A -- false --> D["Both elements removed from DOM\nleave animations play"]

    B --> E["User clicks overlay\nonClose() → service.closeDrawer()\nisDrawerOpen.set(false)"]

    C --> F["Header: count badge = totalCount()"]
    C --> G["Action Buttons"]

    G --> H{selectedIds.size > 0?}
    H -- Yes --> I["Show 'Clear Selection' + 'Delete Selected (N)'"]
    H -- No --> J["Show 'Select All'"]

    I --> K["onClearSelection() → service.clearSelection()\nselectedIds.set(new Set())"]
    I --> L["onDeleteSelected()\nconfirm() dialog\nservice.deleteSelected()\n→ forEach deleteNotification(id)"]

    G --> M["'Mark All Read' (disabled if unreadCount===0)"]
    M --> N["onMarkAllRead()\nservice.markAllAsRead()\nPUT /notifications/read-all\n→ notifications.update(all read: true)"]

    G --> O["'Delete All'"]
    O --> P["confirm() dialog\nonDeleteAll()\nservice.deleteAll()\nDELETE /notifications\n→ notifications.set([])"]

    C --> Q["<app-notification-search />"]
    C --> R["<app-notification-filter />"]
    C --> S["<app-notification-list />"]
```

---

## 9. NotificationSearch + Filter + Sort — Pipeline Flow

This shows how user input eventually mutates `filteredNotifications` computed signal.

```mermaid
flowchart LR
    subgraph USER_INPUT["User Input Layer"]
        UI_SEARCH["User types in search box\n[(ngModel)] searchQuery"]
        UI_FILTER["User clicks filter chip\nonFilterChange(FilterType)"]
        UI_SORT["User changes sort select\nonSortChange(Event)"]
    end

    subgraph SEARCH_PIPE["Search RxJS Pipeline\n(NotificationService constructor)"]
        SP1["onSearchChange()\nservice.setSearch(query)"]
        SP2["searchSubject.next(query)\nBehaviorSubject"]
        SP3["debounceTime(300)\nWait 300ms after last keystroke"]
        SP4["distinctUntilChanged()\nSkip if same value"]
        SP5["searchQuery.set(query)\nWrite to Signal"]
    end

    subgraph SIGNAL_WRITES["Signal Writes"]
        SW1["activeFilter.set(filter)"]
        SW2["activeSort.set(sort)"]
    end

    subgraph COMPUTED["filteredNotifications = computed()"]
        CP1["1. Clone notifications()"]
        CP2["2. switch(activeFilter())\n• all → no-op\n• read → .filter(n.read)\n• unread → .filter(!n.read)\n• high → priority==='high'||'critical'\n• critical → priority==='critical'\n• today → timestamp >= today 00:00\n• week → timestamp >= 7 days ago"]
        CP3["3. if searchQuery:\n.filter(title/category/sender/description\n  .toLowerCase().includes(query))"]
        CP4["4. switch(activeSort())\n• latest → sort by timestamp DESC\n• oldest → sort by timestamp ASC\n• priority → sort by {critical:4,high:3,...}\n• category → localeCompare()"]
        CP5["Return final list\n→ NotificationListComponent renders it"]
    end

    UI_SEARCH --> SP1 --> SP2 --> SP3 --> SP4 --> SP5
    UI_FILTER --> SW1
    UI_SORT --> SW2
    SP5 --> CP1
    SW1 --> CP1
    SW2 --> CP1
    CP1 --> CP2 --> CP3 --> CP4 --> CP5
```

---

## 10. NotificationList + Item — Render & Interaction Flow

```mermaid
flowchart TD
    A["NotificationListComponent renders"]
    A --> B{isLoading() && notifications().length === 0}
    B -- true --> C["Show skeleton 'Loading...'"]
    B -- false --> D{filteredNotifications().length === 0}
    D -- true --> E["Empty state: '📭 No notifications found'"]
    D -- false --> F["@for (notification of filteredNotifications(); track notification.id)"]

    F --> G["<app-notification-item\n  [notification]='n'\n  [selected]='isSelected(n.id)'\n  (markRead)='onMarkRead($event)'\n  (delete)='onDelete($event)'\n  (toggleSelect)='onToggleSelect($event)' />"]

    G --> H["NotificationItemComponent renders"]
    H --> I["[appPriorityBorder]='priority'\n→ border-left: 4px solid {color}"]
    H --> J{"notification.read === false?"}
    J -- false --> K["class 'unread':\n• background: #eff6ff\n• title font-weight: 700\n• blue left dot ::before"]
    J -- true --> L["Normal background"]
    H --> M{"priority === 'critical'?"}
    M -- true --> N["class 'critical':\n• background: #fef2f2\n• border-color: #ef4444"]

    H --> O["User clicks item body\nonMarkRead() — if !read:\n  markRead.emit(id)\n  → list.onMarkRead(id)\n  → service.markAsRead(id)\n  → PUT /:id/read\n  → notifications.update(read:true)"]

    H --> P["User clicks ✕\nonDelete(event)\nevent.stopPropagation()\ndelete.emit(id)\n→ service.deleteNotification(id)"]

    H --> Q["User clicks checkbox\nonToggleSelect(event)\nevent.stopPropagation()\ntoggleSelect.emit(id)\n→ service.toggleSelected(id)\nselectedIds adds/removes id"]

    A --> R{currentPage() < totalPages()}
    R -- true --> S["Show 'Load More' button\nonLoadMore()\n→ service.loadMore()\n→ loadNotifications(page+1)\n→ notifications.update([...list, ...res])"]
```

---

## 11. Toast Component — Display Flow

```mermaid
flowchart TD
    A["ToastComponent renders\n(positioned: fixed, top:20px, right:20px, z:2000)"]
    A --> B["@for (toast of toastService.toasts(); track toast.id)"]
    B --> C["<div class='toast toast-{type}' @slideIn>"]
    C --> D["@slideIn :enter\ntranslateY(-100%) opacity:0\n→ translateY(0) opacity:1\n300ms ease-out"]

    C --> E["getIcon(type)\n• success → ✓\n• error → ✕\n• warning → ⚠\n• info → ℹ"]
    C --> F["@if (toast.title) show title div"]
    C --> G["toast.message"]
    C --> H["✕ button → onClose(id)\n→ toastService.dismiss(id)\n→ toasts.update(filter)"]

    H --> I["@slideIn :leave\ntranslateY(-100%) opacity:0\n300ms ease-in"]

    subgraph PRIORITY_MAPPING["Toast type ← Notification priority"]
        PM1["priority='critical' → type='error' → red border"]
        PM2["priority='high' → type='warning' → amber border"]
        PM3["priority='medium'|'low' → type='info' → blue border"]
        PM4["API success/error callbacks → 'success'|'error'"]
    end
```

---

## 12. Dashboard — Computed Signal Flow

```mermaid
graph LR
    subgraph SERVICE["NotificationService (injected)"]
        NS1["notifications signal"]
        NS2["stats computed"]
        NS3["unreadCount computed"]
        NS4["criticalCount computed"]
    end

    subgraph DASHBOARD["DashboardComponent"]
        D1["categoryStats = computed()\nstats().byCategory entries\n→ map to { key, count, config }"]
        D2["recentActivity = computed()\nnotifications().slice(0, 5)"]
    end

    subgraph TEMPLATE["Template Bindings"]
        T1["Stats Grid\nservice.stats().total\nservice.unreadCount()\nservice.criticalCount()\nservice.stats().high"]
        T2["Category Grid\n@for (item of categoryStats())\nborder-left-color = item.config.color"]
        T3["Recent Activity\n@for (n of recentActivity())\n| timeAgo pipe\n| priority dot background"]
        T4["Quick Actions\n[disabled]='unreadCount()===0'"]
    end

    NS1 --> NS2
    NS1 --> NS3
    NS1 --> NS4
    NS2 --> D1
    NS1 --> D2
    D1 --> T2
    D2 --> T3
    NS3 --> T1
    NS3 --> T4
    NS4 --> T1
    NS2 --> T1
```

---

## 13. Full User Interaction Sequence — Mark Read

```mermaid
sequenceDiagram
    actor User
    participant Item as NotificationItemComponent
    participant List as NotificationListComponent
    participant NS as NotificationService
    participant HTTP as HttpClient
    participant Backend
    participant SIG as notifications Signal
    participant Bell as NotificationBellComponent

    User->>Item: Click on unread notification item
    Item->>Item: onMarkRead() — check !notification.read
    Item->>Item: markRead.emit(notification.id)
    Item->>List: (markRead) output event
    List->>NS: onMarkRead(id) → service.markAsRead(id)
    NS->>HTTP: PUT /notifications/{id}/read
    HTTP->>Backend: HTTP request
    Backend->>Backend: notification.read = true
    Backend-->>HTTP: 200 { ...notification, read: true }
    HTTP-->>NS: next callback
    NS->>SIG: notifications.update(list =>\n  list.map(n => n.id===id ? {...n, read:true} : n))
    SIG-->>NS: unreadCount recomputed (N-1)
    SIG-->>Bell: unreadCount() decreases → badge updates
    Note over Bell: If count drops to 0,\n@if hides badge element
```

---

## 14. Full User Interaction Sequence — Delete

```mermaid
sequenceDiagram
    actor User
    participant Item as NotificationItemComponent
    participant List as NotificationListComponent
    participant NS as NotificationService
    participant HTTP as HttpClient
    participant Backend
    participant SIG as notifications Signal
    participant TS as ToastService
    participant Toast as ToastComponent

    User->>Item: Click ✕ delete button
    Item->>Item: onDelete(event)\nevent.stopPropagation()
    Item->>Item: delete.emit(notification.id)
    Item->>List: (delete) output event
    List->>NS: onDelete(id) → service.deleteNotification(id)
    NS->>HTTP: DELETE /notifications/{id}
    HTTP->>Backend: HTTP request
    Backend->>Backend: splice from array
    Backend-->>HTTP: 200 { message: 'Notification deleted' }
    HTTP-->>NS: next callback
    NS->>SIG: notifications.update(list =>\n  list.filter(n => n.id !== id))
    NS->>SIG: selectedIds.update(remove id if selected)
    NS->>TS: toast.show({ message: 'Notification deleted', type: 'success' })
    TS->>TS: toasts.update(append)
    TS->>TS: setTimeout(dismiss, 4000)
    TS-->>Toast: toasts signal updated → item renders
    Toast->>Toast: @slideIn :enter animation 300ms
    Note over SIG: filteredNotifications recomputed\nitem disappears from list
```

---

## 15. Full User Interaction Sequence — New Notification (WebSocket)

```mermaid
sequenceDiagram
    participant Backend as Node.js (scheduleRandomNotification)
    participant IO as Socket.IO Server
    participant WSC as WebsocketService
    participant NS as NotificationService
    participant SIG as notifications Signal
    participant TS as ToastService
    participant Toast as ToastComponent
    participant Bell as NotificationBellComponent
    participant List as NotificationListComponent

    Note over Backend: setTimeout 8-15s
    Backend->>Backend: generateRandomNotification()\n→ createNotification(template)
    Backend->>IO: io.emit('notification:new', notification)
    IO-->>WSC: Socket event fires
    WSC->>WSC: listen<Notification>('notification:new')\nObservable.next(notification)
    WSC-->>NS: onNotificationNew() subscriber
    NS->>SIG: notifications.update(list => [notification, ...list])
    NS->>NS: totalCount.update(c => c+1)
    SIG-->>NS: unreadCount recomputed (+1)
    SIG-->>Bell: unreadCount() increases
    Bell->>Bell: setInterval poll detects count > prevCount
    Bell->>Bell: ringState.set('ring')\npulseState.set('pulse')
    Bell->>Bell: [@bellRing] keyframe rotate animation
    Bell->>Bell: [@badgePulse] scale animation

    NS->>NS: Determine toast type:\ncritical → 'error'\nhigh → 'warning'\nelse → 'info'
    NS->>TS: toast.show({ title, message, type })
    TS->>TS: toasts.update(append toast)
    TS->>TS: setTimeout(dismiss, 4000)
    TS-->>Toast: Render new toast
    Toast->>Toast: @slideIn :enter 300ms

    SIG-->>List: filteredNotifications recomputed\nnew item at top of list
    Note over List: @for re-renders first item
```

---

## 16. filteredNotifications Computed Signal — Decision Flow

Detail of the three-stage pipeline inside the `computed()` call.

```mermaid
flowchart TD
    A["filteredNotifications = computed()"]
    A --> B["let list = [...notifications()]"]

    B --> C["Stage 1: FILTER\nswitch(activeFilter())"]
    C --> C1{activeFilter}
    C1 -->|all| D1["No change"]
    C1 -->|read| D2["list.filter(n => n.read)"]
    C1 -->|unread| D3["list.filter(n => !n.read)"]
    C1 -->|high| D4["list.filter(n => priority==='high' || 'critical')"]
    C1 -->|critical| D5["list.filter(n => priority==='critical')"]
    C1 -->|today| D6["today = new Date(); setHours(0,0,0,0)\nlist.filter(n => new Date(n.timestamp) >= today)"]
    C1 -->|week| D7["weekAgo = new Date(); setDate(-7)\nlist.filter(n => new Date(n.timestamp) >= weekAgo)"]

    D1 & D2 & D3 & D4 & D5 & D6 & D7 --> E

    E["Stage 2: SEARCH\nquery = searchQuery().toLowerCase().trim()"]
    E --> F{query.length > 0?}
    F -- No --> G["Skip — return list as-is"]
    F -- Yes --> H["list.filter(n =>\n  title.toLowerCase().includes(query) ||\n  category.toLowerCase().includes(query) ||\n  sender.toLowerCase().includes(query) ||\n  description.toLowerCase().includes(query))"]

    G & H --> I

    I["Stage 3: SORT\nswitch(activeSort())"]
    I --> I1{activeSort}
    I1 -->|latest| J1["sort((a,b) =>\n  new Date(b.timestamp) - new Date(a.timestamp))"]
    I1 -->|oldest| J2["sort((a,b) =>\n  new Date(a.timestamp) - new Date(b.timestamp))"]
    I1 -->|priority| J3["order={critical:4,high:3,medium:2,low:1}\nsort((a,b) => order[b.priority]-order[a.priority])"]
    I1 -->|category| J4["sort((a,b) =>\n  a.category.localeCompare(b.category))"]

    J1 & J2 & J3 & J4 --> K["return list\n→ NotificationListComponent\n  @for renders each item"]
```

---

## 17. HTTP REST API Interaction Flow

All HTTP calls from `NotificationService` mapped to backend routes.

```mermaid
flowchart LR
    subgraph NS["NotificationService Methods"]
        M1["loadNotifications(page)\nGET /notifications?page=N&limit=20"]
        M2["markAsRead(id)\nPUT /notifications/:id/read"]
        M3["markAllAsRead()\nPUT /notifications/read-all"]
        M4["deleteNotification(id)\nDELETE /notifications/:id"]
        M5["deleteAll()\nDELETE /notifications"]
    end

    subgraph SIGNALS["Signal Updates on Success"]
        R1["notifications.set(res.notifications)\ncurrentPage.set() / totalPages.set()\ntotalCount.set()"]
        R2["notifications.update(\n  list.map(n => id===n.id ? {...n,read:true} : n))"]
        R3["notifications.update(\n  list.map(n => ({...n, read:true})))\ntoast: 'All notifications marked as read'"]
        R4["notifications.update(list.filter(id))\nselectedIds.update(remove id)\ntoast: 'Notification deleted'"]
        R5["notifications.set([])\nselectedIds.set(new Set())\ntoast: 'All notifications deleted'"]
    end

    subgraph ERR["On Error → toast.show(error)"]
        E1["'Failed to load notifications'"]
        E2["'Failed to mark as read'"]
        E3["'Failed to mark all as read'"]
        E4["'Failed to delete notification'"]
        E5["'Failed to delete notifications'"]
    end

    M1 --> R1
    M1 -.-> E1
    M2 --> R2
    M2 -.-> E2
    M3 --> R3
    M3 -.-> E3
    M4 --> R4
    M4 -.-> E4
    M5 --> R5
    M5 -.-> E5

    style R1 fill:#d1fae5
    style R2 fill:#d1fae5
    style R3 fill:#d1fae5
    style R4 fill:#d1fae5
    style R5 fill:#d1fae5
    style E1 fill:#fee2e2
    style E2 fill:#fee2e2
    style E3 fill:#fee2e2
    style E4 fill:#fee2e2
    style E5 fill:#fee2e2
```

---

## 18. Angular Change Detection & Signal Reactivity Map

How a single backend push cascades through the entire signal graph to update every view.

```mermaid
graph TB
    WS_EVENT["🌐 WebSocket Event Arrives\n'notification:new'"]

    WS_EVENT --> NS_UPDATE["NotificationService\nnotifications.update(prepend)"]

    NS_UPDATE --> COMP1["unreadCount\ncomputed — recalculates"]
    NS_UPDATE --> COMP2["criticalCount\ncomputed — recalculates"]
    NS_UPDATE --> COMP3["filteredNotifications\ncomputed — recalculates\n(filter + search + sort)"]
    NS_UPDATE --> COMP4["stats\ncomputed — recalculates\n(total, unread, byCategory)"]

    COMP1 --> VIEW1["NotificationBellComponent\nbadge number updates\nif OnPush: markForCheck via signal"]
    COMP1 --> VIEW2["NotificationDrawerComponent\naction button disabled state"]
    COMP2 --> VIEW3["DashboardComponent\nCritical stat card"]
    COMP3 --> VIEW4["NotificationListComponent\n@for re-renders list\nnew item added at top"]
    COMP4 --> VIEW5["DashboardComponent\nAll 4 stat cards\ncategoryStats computed\nrecentActivity computed"]

    NS_UPDATE --> TOAST_SVC["ToastService\ntoasts.update(append)"]
    TOAST_SVC --> VIEW6["ToastComponent\n@for renders new toast\n@slideIn plays\nsetTimeout(dismiss, 4000)"]

    style WS_EVENT fill:#1e293b,color:#fff
    style NS_UPDATE fill:#3b82f6,color:#fff
    style COMP1 fill:#7c5cd8,color:#fff
    style COMP2 fill:#7c5cd8,color:#fff
    style COMP3 fill:#7c5cd8,color:#fff
    style COMP4 fill:#7c5cd8,color:#fff
    style TOAST_SVC fill:#f59e0b,color:#fff
    style VIEW1 fill:#d1fae5
    style VIEW2 fill:#d1fae5
    style VIEW3 fill:#d1fae5
    style VIEW4 fill:#d1fae5
    style VIEW5 fill:#d1fae5
    style VIEW6 fill:#fef3c7
```

---

*Generated from source code analysis of the Angular 19 Notification Center project.*
