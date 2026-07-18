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

When you run `ng serve`, the Angular CLI starts a `webpack-dev-server` on port 4200. This dev server injects a small WebSocket client into the browser bundle. It connects back to `ws://localhost:4200` and listens for messages from the dev server (e.g., "a file changed — please reload").

The `?token=...` parameter is a **per-session security token** generated automatically by webpack-dev-server. It prevents other browser tabs or pages from accidentally triggering reloads on your dev server.

> **This connection only exists during development.** It is never present in a production build (`ng build`).

---

## Side-by-side Comparison

| | Connection 1 | Connection 2 |
|---|---|---|
| URL | `ws://localhost:3000/socket.io/…` | `ws://localhost:4200/?token=…` |
| Port | 3000 | 4200 |
| Type | Socket.io (Engine.io v4) | webpack-dev-server |
| Purpose | Real-time notifications | Live reload / HMR |
| Created by | `WebsocketService` (app code) | Angular CLI (`ng serve`) |
| Exists in production? | ✅ Yes | ❌ No |
| Token param | None | Yes (session auth for dev server) |

---

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
