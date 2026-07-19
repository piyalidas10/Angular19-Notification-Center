# Real-Time Notification Center

A production-ready notification center built with **Angular 19** (Signals, Standalone Components, Control Flow) + **Node.js** (Express, Socket.IO, TypeScript).

<img src="img/run_application.png" width="100%" />

## Features

- 🔔 **Real-time notifications** via WebSocket (Socket.IO)
- 📡 **Backend pushes** new notifications every 8–15 seconds
- 🔵 **Unread badge counter** using Angular Computed Signals
- 🎛️ **Filter & sort** by category, priority, date
- 🔍 **Search** with RxJS debounce + distinctUntilChanged
- 🍞 **Toast notifications** with auto-dismiss and queue
- ✓ **Mark read / unread / mark all read**
- 🗑️ **Delete one / multiple (with checkboxes) / all**
- 📊 **Dashboard** with live stats and category breakdown
- 📱 **Responsive** mobile-friendly layout
- 🎭 **Angular Animations** — bell ring, drawer slide, toast slide
- 8 notification **categories** with unique colors and icons
- 4 **priority levels** with visual indicators

<img src="img/Angular 19 notification system diagram.png" width="100%" />

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, Standalone, Signals, RxJS, SCSS |
| Backend | Node.js, Express, Socket.IO, TypeScript |
| Transport | WebSockets (Socket.IO) + REST APIs |
| Data | In-memory mock database |

## To Run
```
cd backend && npm run dev     # → http://localhost:3000
cd frontend && npm start      # → http://localhost:4200
```

**When you run Angular application :**
```
npm start
```
You'll typically have two WebSocket connections:
```
Browser
   │
   ├──────────────► ws://localhost:4200/?token=...
   │                 (Vite HMR)
   │
   └──────────────► ws://localhost:3000/socket.io/?EIO=4&transport=websocket
                     (Your Socket.IO server)
```
- 4200 → Vite development server
- 3000 → Node.js + Socket.IO backend

**How to verify**
```
Open Chrome DevTools → Network → WS. 
```
You'll typically see something like:              
| URL                                       | Purpose                 |
| ----------------------------------------- | ----------------------- |
| `ws://localhost:4200/?token=...`          | ✅ Vite HMR              |
| `ws://localhost:3000/socket.io/?EIO=4...` | ✅ Your Socket.IO server |


## Quick Start

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start the backend

```bash
cd backend
npm run dev
# Server: http://localhost:3000
```

### 3. Start the frontend

```bash
cd frontend
npm start
# App: http://localhost:4200
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List notifications (paginated) |
| GET | `/notifications/:id` | Get notification by ID |
| POST | `/notifications` | Create notification |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete one |
| DELETE | `/notifications` | Delete all |

## WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `notification:new` | Server → Client | New notification arrived |
| `notification:read` | Server → Client | Notification marked read |
| `notification:read-all` | Server → Client | All marked read |
| `notification:delete` | Server → Client | Notification(s) deleted |
| `notification:update` | Server → Client | Notification updated |

## Angular Architecture Highlights

```
src/app/
├── core/
│   ├── animations/         # Reusable Angular animations
│   └── services/
│       ├── notification.service.ts   # Signal-based state management
│       ├── websocket.service.ts      # Socket.IO RxJS wrapper
│       └── toast.service.ts          # Toast queue management
├── shared/
│   ├── models/             # TypeScript interfaces
│   ├── enums/              # Category & priority configs
│   ├── pipes/              # timeAgo, categoryLabel
│   └── directives/         # priorityBorder, categoryColor
└── features/
    ├── dashboard/           # Main dashboard view
    └── notification-center/ # All notification components
        └── components/
            ├── notification-bell/
            ├── notification-item/
            ├── notification-list/
            ├── notification-filter/
            ├── notification-search/
            ├── notification-drawer/
            └── toast/
```
## Overall System Architecture
```
Angular 19
    │
    ├── HTTP Client
    ├── Signals Store
    ├── Notification Service
    ├── WebSocket Service
    │
    ▼
Node.js + Express
    │
    ├── REST API
    ├── Notification Service
    ├── Socket.IO Server
    └── Data Store
```

## Complete End-to-End Sequence Diagram
```
User
 │
 ▼
Angular Component
 │
 ▼
Notification Service
 │
 ├────────HTTP────────► Express Route
 │                      │
 │                      ▼
 │               Notification Service
 │                      │
 │                      ▼
 │               Update Data
 │                      │
 │                      ▼
 │                io.emit(...)
 │                      │
 ▼                      ▼
HTTP Response     Socket.IO Broadcast
 │                      │
 ▼                      ▼
Signal Store ◄──────────┘
 │
 ▼
Notification Component
 │
 ▼
Updated UI
```

## Application Startup Flow
```
Browser
   │
Angular Bootstrap
   │
App Component
   │
Load Notifications
   │
HTTP GET /notifications
   │
Backend
   │
Return Data
   │
Signals Updated
   │
UI Rendered
```

## Notification 
### Notification Creation Flow
```
User Click
     │
     ▼
Angular Component
     │
NotificationService
     │
HTTP POST
     │
Express Route
     │
Notification Controller
     │
Notification Service
     │
Store Notification
     │
io.emit("notification:new")
     │
────────────┬────────────
            │
     All Connected Clients
            │
WebsocketService.listen()
            │
Signals Store
            │
Notification List Updated
```

### Notification - Mark as Read Flow
```
User
 │
 ▼
PUT /read/:id
 │
Backend
 │
Update Notification
 │
io.emit("notification:read")
 │
Angular WebSocket
 │
Signal Store
 │
UI Updated
```

### Notification - Mark All Read Flow
User
 │
 ▼
PUT /read-all
 │
Backend
 │
markAllAsRead()
 │
io.emit("notification:read-all")
 │
Every Browser
 │
Notification Store
 │
UI Refresh

### Notification - Delete Notification Flow
Delete Button
      │
HTTP DELETE
      │
Express
      │
Delete Service
      │
io.emit("notification:delete")
      │
Angular
      │
Remove Signal
      │
UI Updated

## WebSocket End-to-End Lifecycle
```
Angular App
     │
     │ io("http://localhost:3000")
     ▼
Socket.IO Server
     │
     ▼
connection event
     │
     ▼
socket created
     │
     ├────────► disconnect
     │
     └────────► notification:request
                     │
                     ▼
      generateRandomNotification()
                     │
                     ▼
      io.emit('notification:new', notification)
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
     Client A    Client B    Client C
                     │
                     ▼
          Angular UI updates instantly
```
This pattern—client emits an event to the server, the server processes it, and then broadcasts a result to all interested clients—is the core communication model used in many real-time applications such as chat systems, live dashboards, multiplayer games, collaborative editors, and notification services.

## WebSocket Lifecycle
```
Angular
     │
io(environment.wsUrl)
     │
───────────────
Socket.IO Server
───────────────
     │
connection
     │
socket.id
     │
notification:new
notification:update
notification:delete
notification:read
notification:read-all
     │
disconnect
```

## Frontend Folder Workflow
```
Component
      │
      ▼
Facade / Notification Service
      │
      ├────────HTTP─────────► REST API
      │
      └────────Socket────────► WebSocket Service
                              │
                              ▼
                        Signal Store
                              │
                              ▼
                             UI
```

## Backend Request Flow
```
Route
 │
Controller
 │
Business Logic
 │
Repository / Mock Data
 │
Socket.IO Broadcast
 │
HTTP Response
```


### Angular 19 Signals Pattern

```typescript
// Computed Signal — updates automatically
readonly unreadCount = computed(() =>
  this.notifications().filter(n => !n.read).length
);

// Effect — side effects when signals change
effect(() => {
  if (this.criticalCount() > 0) { /* play sound */ }
});
```
