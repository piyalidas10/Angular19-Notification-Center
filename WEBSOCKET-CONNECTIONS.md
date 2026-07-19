# WebSocket Connections — Explained

Two WebSocket connections are visible in the browser DevTools. They serve **completely different purposes**.

> frontend\src\app\core\services\websocket.service.ts
> This service is an Angular WebSocket service that uses Socket.IO to maintain a real-time connection with a backend server. Instead of opening and closing connections in every component, the application creates one shared connection and exposes it through RxJS Observables.

---

## Connection 1 — Application Socket.io

```
ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

| Property | Value |
|---|---|
| **Type** | Socket.io (Engine.io protocol v4) |
| **Port** | 3000 (backend server) |
| **Purpose** | Real-time notifications |
| **Established by** | `WebsocketService` constructor (application code) |
| **Configuration** | `environment.wsUrl` in `environment.ts` |

### How it works

[`WebsocketService`](frontend/src/app/core/services/websocket.service.ts) calls `io(environment.wsUrl)` at startup, opening a persistent Socket.io connection to the NestJS backend.

[`NotificationService`](frontend/src/app/core/services/notification.service.ts) subscribes to these Socket.io events through `WebsocketService`:

| Event | Action |
|---|---|
| `notification:new` | Prepends notification to list, shows a toast |
| `notification:update` | Updates a notification in the list |
| `notification:delete` | Removes one or all notifications |
| `notification:read` | Marks a single notification as read |
| `notification:read-all` | Marks all notifications as read |

The `?EIO=4&transport=websocket` query parameters are added automatically by the Socket.io client library — they are part of the Engine.io handshake protocol, not custom app code.

---

## Connection 2 — Angular Dev Server (Live Reload / HMR)

```
ws://localhost:4200/?token=oChd9WNBTJJR
```

| Property | Value |
|---|---|
| **Type** | webpack-dev-server internal WebSocket |
| **Port** | 4200 (Angular CLI dev server) |
| **Purpose** | Live reload & Hot Module Replacement (HMR) |
| **Established by** | Angular CLI automatically when you run `ng serve` |
| **Configuration** | No explicit config — webpack-dev-server default |

### How it works

When you run ng serve with the `Vite-based development server` (used by recent Angular versions), the Angular CLI starts a Vite dev server on port 4200. The Vite client is automatically injected into the browser bundle and establishes a WebSocket connection to `ws://localhost:4200`

The `?token=...` query parameter is a **per-session security token** generated automatically by the Vite development server. It helps ensure that only browser sessions connected to the current development server can establish the HMR WebSocket connection, preventing unauthorized or stale clients from receiving development updates.

You're running your Angular app with Vite (the default development builder in newer Angular versions), that connection is Vite's Hot Module Replacement (HMR) / Live Reload WebSocket, not your application's Socket.IO connection.

This WebSocket is used for Hot Module Replacement (HMR) and Live Reload. The browser listens for messages from the Vite dev server, such as:
- A source file has changed
- A module should be hot-updated without reloading the page
- A full page reload is required
- Build errors or warnings should be displayed in the browser

> **This connection only exists during development.** It is never present in a production build (`ng build`). It is unrelated to your application's Socket.IO or WebSocket implementation and is not included in production builds.

### Will it exist in production?

No.

In production:
```
❌ No Vite HMR WebSocket
❌ No ws://localhost:4200/?token=...
```
Only your application's WebSocket (if your app uses one) will remain, for example:
```
wss://api.example.com/socket.io/
```
where wss:// is the secure WebSocket protocol used over HTTPS.

So, seeing two WebSocket connections during development is completely normal:
- One belongs to Vite for development tooling.
- The other belongs to your application for real-time communication.


---

## Side-by-side Comparison

| Feature             | Vite HMR WebSocket                        | Socket.IO WebSocket                     |
| ------------------- | ----------------------------------------- | --------------------------------------- |
| Purpose             | Hot Module Replacement (HMR), Live Reload | Real-time application communication     |
| Runs in Development | ✅ Yes                                     | ✅ Yes                                   |
| Runs in Production  | ❌ No                                      | ✅ Yes                                   |
| Port (Typical)      | `4200`                                    | `3000` (or your backend port)           |
| Created By          | Vite Dev Server                           | Your Node.js + Socket.IO server         |
| Used For            | Reloading code changes                    | Notifications, Chat, Live Updates, etc. |

---

## Development

When you run:
```
ng serve
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

### How to verify
```
Open Chrome DevTools → Network → WS. 
```
You'll typically see something like:              
| URL                                       | Purpose                 |
| ----------------------------------------- | ----------------------- |
| `ws://localhost:4200/?token=...`          | ✅ Vite HMR              |
| `ws://localhost:3000/socket.io/?EIO=4...` | ✅ Your Socket.IO server |


1. Your application's Socket.IO connection

Example:
```
ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```
Purpose:
- Real-time notifications
- Chat
- Live updates
- Socket.IO events

Created by:
```
io(environment.wsUrl);
```

2. Vite development WebSocket

Example:
```
ws://localhost:4200/?token=oChd9WNBTJJR
```
Purpose:
- Hot Module Replacement (HMR)
- Live Reload
- Error overlay
- Automatic browser refresh during development

Created automatically by the Vite dev server.

Flow:
```
          Vite Dev Server (4200)
                  │
                  │
        HMR WebSocket
                  │
                  ▼
             Browser

If a file changes

↓

Browser updates automatically
```

### Why does Vite need a WebSocket?

Suppose you change:
```
app.component.ts
```
Vite detects the file change:
```
File Changed
      │
      ▼
Vite Server
      │
      ▼
HMR WebSocket
      │
      ▼
Browser
      │
      ▼
Reload only the changed module
```
Without that WebSocket, you'd have to manually refresh the page after every code change.

## Production

After building and deploying:
```
ng build
```
there is no Vite development server, so the HMR WebSocket disappears.

The architecture becomes:
```
              Browser
                  │
                  │ HTTPS
                  ▼
         Angular Production App
                  │
                  │
                  ├────────► REST API
                  │
                  └────────► wss://api.example.com/socket.io/
                             (Socket.IO)
```
Only your application's Socket.IO connection remains.

**In application, Based on your code:**

Angular
```
this.socket = io(environment.wsUrl);
```
Node.js
```
const io = new SocketIOServer(httpServer);
```
Server
```
io.emit('notification:new', notification);
```
These are your application's real-time communication components and should continue to work in production (assuming the backend is deployed and WebSocket traffic is allowed by your reverse proxy or load balancer).

So, in production you'll see something like:
```
wss://api.yourdomain.com/socket.io/?EIO=4&transport=websocket
```
instead of the development-only:
```
ws://localhost:4200/?token=...
```
The wss:// protocol is the secure version of WebSocket, analogous to how https:// is the secure version of HTTP.


## Architecture Diagram

```
Browser
  │
  ├── ws://localhost:3000/socket.io/        ← Application Socket
  │     Socket.io client (socket.io-client)
  │     WebsocketService → NotificationService
  │     Events: notification:new / update / delete / read / read-all
  │
  └── ws://localhost:4200/?token=…          ← Dev Server Socket
        webpack-dev-server HMR client
        Injected by Angular CLI (ng serve only)
        Messages: file-change → reload / patch
```

---

## Overall Flow

```
                Angular App
                     │
                     ▼
         WebsocketService (Singleton)
                     │
             io(environment.wsUrl)
                     │
             Socket.IO Connection
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 notification:new  update        delete
      │              │              │
      ▼              ▼              ▼
   listen<T>()   listen<T>()   listen<T>()
      │
      ▼
Observable<Notification>
      │
      ▼
Angular Component subscribes
      │
      ▼
UI updates instantly
```

---

## Relevant Files

| File | Role |
|---|---|
| [`frontend/src/app/core/services/websocket.service.ts`](frontend/src/app/core/services/websocket.service.ts) | Opens the Socket.io connection to port 3000 |
| [`frontend/src/app/core/services/notification.service.ts`](frontend/src/app/core/services/notification.service.ts) | Consumes Socket.io events, updates UI state |
| [`frontend/src/environments/environment.ts`](frontend/src/environments/environment.ts) | Defines `wsUrl: 'http://localhost:3000'` |
| [`frontend/angular.json`](frontend/angular.json) | Angular CLI / dev server configuration |
