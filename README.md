# DisasterNet

A real time emergency communication system built with the **MERN stack** . Designed to work **completely offline** over a local network (no internet required).

## Features


- **Real-time messaging** 
- **File sharing** 
- **Multiple chat rooms** 
- **Typing indicators** 
- **Offline-first design** 
- **Real-time messaging**

### Example Scenario

> A rescue team arrives at a disaster zone with no cell service. One member turns on their phone's hotspot. A laptop connected to the hotspot runs DisasterNet. All team members connect their phones to the same hotspot and open the app in their browser. They coordinate in real time (no internet required).

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/RamThokane/DisasterNet/
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
npm run dev     
npm start       
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



### How It Works

One device creates a **Wi-Fi Hotspot** and all other devices connect to it. The hotspot creates a local network no internet needed.

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

   Look for the **IPv4 Address** 

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



---
