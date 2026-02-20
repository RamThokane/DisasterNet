# DisasterNet

A real-time emergency communication system built with the **MERN stack** (MongoDB, Express.js, React, Node.js). Designed to work **completely offline** over a local network — no internet required.

---

## Features

- **Username & password authentication** — secure sign-up/sign-in with bcrypt-hashed passwords and JWT tokens
- **Real-time messaging** — instant communication via Socket.io WebSockets
- **File sharing** — send images, documents, audio, video, and archives (up to 50 MB) with inline preview
- **Multiple chat rooms** — create and join separate channels for organized communication
- **Typing indicators** — see when other users are typing in real time
- **Offline-first design** — works entirely on a local network (Wi-Fi hotspot, LAN, USB tethering)
- **Responsive UI** — clean, modern interface that works on desktop and mobile
- **Persistent storage** — all messages and files are saved in MongoDB
- **Security** — Helmet headers, CORS, bcrypt password hashing, JWT auth, input validation

---

## Tech Stack

| Layer    | Technology                                                |
| -------- | --------------------------------------------------------- |
| Frontend | React 18, Vite 6, Tailwind CSS 3, Axios, Socket.io Client |
| Backend  | Node.js, Express 4, Socket.io 4, Mongoose 8, Multer       |
| Database | MongoDB                                                   |
| Auth     | JWT + bcryptjs                                            |
| Icons    | Lucide React                                              |

---

## Project Structure

```
DisasterNet/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection & environment variables
│   │   ├── controllers/     # Route handlers (auth, messages, rooms)
│   │   ├── middleware/       # JWT auth guard, error handler, validation
│   │   ├── models/           # Mongoose schemas (User, Message, Room)
│   │   ├── routes/           # Express route definitions
│   │   ├── socket/           # Socket.io event handlers
│   │   └── server.js         # Application entry point
│   ├── uploads/              # Uploaded files (auto-created)
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx      # Sign In / Sign Up page
│   │   │   ├── Chat/             # ChatRoom, MessageList, MessageInput, RoomList
│   │   │   └── Layout/           # Header
│   │   ├── context/              # AuthContext, SocketContext
│   │   ├── services/             # Axios API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18
- **MongoDB** running locally (or a MongoDB Atlas URI)
- **npm**

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd DisasterNet
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/disasternet
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=*
```

> Set `CLIENT_URL=*` to allow connections from any device on the network.

Start the server:

```bash
npm run dev     # Development (auto-restart with nodemon)
npm start       # Production
```

### 3. Frontend

```bash
cd frontend
npm install
```

Start the dev server:

```bash
npx vite --host 0.0.0.0
```

> The `--host` flag exposes the app on your local network so other devices can connect.

The frontend runs at **http://localhost:5173** and auto-detects the backend at the same hostname on port **3001**.

---

## Authentication

DisasterNet uses **username + password** authentication.

### Sign Up

1. Open the app and click the **Sign Up** tab
2. Enter a **username** (3–30 characters, letters/numbers/underscores only)
3. Enter a **password** (minimum 6 characters)
4. Confirm the password and click **Create Account**

### Sign In

1. Click the **Sign In** tab
2. Enter your username and password
3. Click **Sign In**

Passwords are hashed with bcrypt (12 salt rounds). Sessions persist via JWT stored in localStorage.

---

## API Endpoints

### Auth

| Method | Route                | Description        | Auth     |
| ------ | -------------------- | ------------------ | -------- |
| POST   | `/api/auth/register` | Create new account | No       |
| POST   | `/api/auth/login`    | Sign in            | No       |
| GET    | `/api/auth/me`       | Get current user   | Required |
| POST   | `/api/auth/logout`   | Sign out           | Required |

**Register body:** `{ "username": "rescue_alpha", "password": "mypassword" }`

**Login body:** `{ "username": "rescue_alpha", "password": "mypassword" }`

### Rooms

| Method | Route                  | Description    | Auth     |
| ------ | ---------------------- | -------------- | -------- |
| GET    | `/api/rooms`           | List all rooms | Required |
| POST   | `/api/rooms`           | Create room    | Required |
| GET    | `/api/rooms/:id`       | Get room       | Required |
| POST   | `/api/rooms/:id/join`  | Join room      | Required |
| POST   | `/api/rooms/:id/leave` | Leave room     | Required |

### Messages

| Method | Route                          | Description         | Auth     |
| ------ | ------------------------------ | ------------------- | -------- |
| GET    | `/api/messages/:roomId`        | Get room messages   | Required |
| POST   | `/api/messages/:roomId`        | Send text message   | Required |
| POST   | `/api/messages/:roomId/upload` | Upload file to room | Required |

### Legacy (Go API Compatible)

| Method | Route       | Description                        |
| ------ | ----------- | ---------------------------------- |
| GET    | `/messages` | Get all messages (string array)    |
| POST   | `/send`     | Send a message `{"message":"..."}` |

### Health

| Method | Route         | Description   |
| ------ | ------------- | ------------- |
| GET    | `/api/health` | Server status |

---

## Socket.io Events

| Event              | Direction       | Description                   |
| ------------------ | --------------- | ----------------------------- |
| `join-room`        | Client → Server | Join a chat room              |
| `leave-room`       | Client → Server | Leave a chat room             |
| `send-message`     | Client → Server | Send message to room          |
| `new-message`      | Server → Client | New message broadcast         |
| `user-joined`      | Server → Client | User joined notification      |
| `user-left`        | Server → Client | User left notification        |
| `typing`           | Client → Server | Typing indicator start        |
| `user-typing`      | Server → Client | User is typing broadcast      |
| `stop-typing`      | Client → Server | Typing indicator stop         |
| `user-stop-typing` | Server → Client | User stopped typing broadcast |

---

## Database Schemas

### User

```
{
  username:    String (required, unique, 3–30 chars, alphanumeric + underscores)
  password:    String (required, min 6 chars, bcrypt hashed, excluded from queries)
  isOnline:    Boolean (default: false)
  createdAt:   Date (auto)
  updatedAt:   Date (auto)
}
```

### Message

```
{
  message:      String (max 2000 chars)
  messageType:  "text" | "file" | "image" (default: "text")
  file: {
    filename:     String
    originalName: String
    mimetype:     String
    size:         Number
    path:         String
  }
  senderNick:   String (sender's username at time of message)
  senderId:     ObjectId → User
  room:         ObjectId → Room
  createdAt:    Date (auto)
  updatedAt:    Date (auto)
}
```

### Room

```
{
  name:         String (required, unique, 2–50 chars)
  description:  String (max 200 chars)
  createdBy:    ObjectId → User
  participants: [ObjectId → User]
  createdAt:    Date (auto)
  updatedAt:    Date (auto)
}
```

---

## Environment Variables

| Variable         | Description               | Default                                 |
| ---------------- | ------------------------- | --------------------------------------- |
| `PORT`           | Backend server port       | `3001`                                  |
| `NODE_ENV`       | Environment mode          | `development`                           |
| `MONGO_URI`      | MongoDB connection string | `mongodb://localhost:27017/disasternet` |
| `JWT_SECRET`     | JWT signing secret        | _(must be set)_                         |
| `JWT_EXPIRES_IN` | JWT expiration duration   | `7d`                                    |
| `CLIENT_URL`     | Frontend URL for CORS     | `*` (allow all origins)                 |

---

## File Sharing

Send images, documents, audio, video, and archives in any chat room.

### Supported File Types

| Category  | Types                                          |
| --------- | ---------------------------------------------- |
| Images    | JPEG, PNG, GIF, WebP, SVG                      |
| Documents | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV |
| Audio     | MP3, WAV, OGG                                  |
| Video     | MP4, WebM, OGG                                 |
| Archives  | ZIP, RAR, GZIP                                 |

### How to Use

1. Open a chat room
2. Click the **paperclip** icon next to the message input
3. Select a file (max **50 MB**)
4. A preview bar appears showing the file name, size, and thumbnail (for images)
5. Click **Send** to upload
6. **Images** display inline in the chat — click to open full-size
7. **Other files** appear as a download card with file name, size, and download button
8. All uploads are broadcast in real time to everyone in the room

### Storage

Files are saved to `backend/uploads/` and served at `/uploads/<filename>`. The directory is created automatically on server start.

---

## Offline / Disaster Mode

This is the **core use case** — communicating when there is no internet.

### How It Works

One device creates a **Wi-Fi Hotspot** and all other devices connect to it. The hotspot creates a local network — no internet needed.

### Step-by-Step

1. **On one phone** — turn on **Mobile Hotspot** (Settings → Hotspot & Tethering)
2. **Connect your PC** (the server machine) to the hotspot Wi-Fi
3. **Connect all other devices** to the same hotspot
4. **Start the app** on your PC:

   ```powershell
   # Terminal 1 — Backend
   cd backend
   npm run dev

   # Terminal 2 — Frontend
   cd frontend
   npx vite --host 0.0.0.0
   ```

5. **Find your PC's local IP:**

   ```powershell
   ipconfig
   ```

   Look for the **IPv4 Address** under the hotspot adapter (e.g., `192.168.43.x`)

6. **On every device**, open a browser and go to:

   ```
   http://<your-pc-ip>:5173
   ```

7. **Sign up** on each device and start chatting!

### Requirements

- All devices must be on the **same local network**
- MongoDB must be running on the server machine
- Backend `.env` must have `CLIENT_URL=*`
- Works with: **Wi-Fi hotspot, Ethernet LAN, USB tethering**

### Example Scenario

> A rescue team arrives at a disaster zone with no cell service. One member turns on their phone's hotspot. A laptop connected to the hotspot runs DisasterNet. All team members connect their phones to the same hotspot and open the app in their browser. They coordinate in real time — no internet required.

---

## No Internet, But Nearby (Original Use Case)

This is the scenario DisasterNet was originally built for — devices that are **physically close** but have **no internet access**. The original Go version worked exactly the same way: devices had to be on the same local network via hotspot, Ethernet, or Wi-Fi.

### How It Works

One phone creates a **Wi-Fi Hotspot**, and all nearby devices connect to it. The hotspot provides a local network between devices — **no internet or cell service is needed**.

### Step-by-Step

1. **On one phone** — turn on **Mobile Hotspot** (Settings → Hotspot)
2. **Connect your PC** (running the server) and **all other devices** to that hotspot
3. **Run the app** on your PC as described in [Setup Instructions](#setup-instructions):

   ```powershell
   # Terminal 1 — Backend
   cd backend
   npm run dev

   # Terminal 2 — Frontend
   cd frontend
   npx vite --host 0.0.0.0
   ```

4. **Find your PC's new IP** on the hotspot network:

   ```powershell
   ipconfig
   ```

   Look for the **IPv4 Address** under the hotspot adapter (e.g., `192.168.x.x`)

5. **On all devices**, open a browser and go to:

   ```
   http://THAT_IP:5173
   ```

   (Replace `THAT_IP` with the actual IP from step 4)

6. **Sign up** on each device and start communicating!

> This is exactly how the original Go version worked too — it required all devices to be on the same local network via hotspot, Ethernet, or Wi-Fi. The MERN rebuild preserves this core design while adding a full UI, authentication, file sharing, and persistent message storage.
