# Video Sharing and Synchronized Controls API

This document describes the backend implementation for simultaneous video sharing and shared controls in chatrooms.

## Overview

The video sharing feature allows users to:
- Start video sessions in chatrooms
- Share video playback with synchronized controls
- Control playback (play, pause, seek, volume, speed) for all participants
- Track video session history
- Enable/disable synchronization features

## Models

### VideoSession Model
```javascript
{
  chatroom: ObjectId,           // Reference to chatroom
  host: ObjectId,              // User who started the session
  participants: [ObjectId],    // Users currently in the session
  videoUrl: String,            // URL of the video to play
  title: String,               // Optional title
  description: String,         // Optional description
  
  // Playback state
  isPlaying: Boolean,          // Current play/pause state
  currentTime: Number,         // Current timestamp in seconds
  playbackRate: Number,        // Playback speed (1.0 = normal)
  volume: Number,              // Volume level (0-1)
  isMuted: Boolean,            // Mute state
  
  // Synchronization
  lastSyncTime: Date,          // Last time state was updated
  syncEnabled: Boolean,        // Whether sync is enabled
  
  // Session management
  isActive: Boolean,           // Whether session is active
  startedAt: Date,             // When session started
  endedAt: Date,               // When session ended
  
  // Permissions
  allowUserControl: Boolean,   // Whether users can control playback
  controlLockedBy: ObjectId,   // User who has control lock
  enableVideoChat: Boolean     // Whether video chat is enabled
}
```

## API Endpoints

### Video Session Management

#### Start Video Session
```
POST /api/chatroom/:id/video/start
```
**Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "title": "Study Session Video",
  "description": "Optional description",
  "enableVideoChat": false
}
```

#### Join Video Session
```
POST /api/chatroom/:id/video/join
```

#### Leave Video Session
```
POST /api/chatroom/:id/video/leave
```

#### End Video Session (Host Only)
```
POST /api/chatroom/:id/video/end
```

#### Get Current Video Session
```
GET /api/chatroom/:id/video
```

#### Get Video Session History
```
GET /api/chatroom/:id/video/history?page=1&limit=10
```

#### Update Video Session Settings (Host Only)
```
PATCH /api/chatroom/:id/video/settings
```
**Body:**
```json
{
  "allowUserControl": true,
  "syncEnabled": true,
  "enableVideoChat": false
}
```

## Socket.IO Events

### Client → Server Events

#### Join Video Session
```javascript
socket.emit("joinVideoSession", { roomId: "chatroom_id" });
```

#### Leave Video Session
```javascript
socket.emit("leaveVideoSession", { roomId: "chatroom_id" });
```

#### Video Control Events
```javascript
// Play video
socket.emit("videoPlay", { roomId: "chatroom_id", timestamp: 120.5 });

// Pause video
socket.emit("videoPause", { roomId: "chatroom_id", timestamp: 120.5 });

// Seek to position
socket.emit("videoSeek", { roomId: "chatroom_id", timestamp: 180.0 });

// Change volume
socket.emit("videoVolumeChange", { roomId: "chatroom_id", volume: 0.8 });

// Change playback rate
socket.emit("videoRateChange", { roomId: "chatroom_id", rate: 1.25 });

// Request current video state for synchronization
socket.emit("requestVideoSync", { roomId: "chatroom_id" });
```

### Server → Client Events

#### Video Session Events
```javascript
// When user joins video session
socket.on("userJoinedVideo", (data) => {
  console.log(`${data.userName} joined the video session`);
});

// When user leaves video session
socket.on("userLeftVideo", (data) => {
  console.log(`${data.userName} left the video session`);
});

// When video session is joined
socket.on("videoSessionJoined", (videoSession) => {
  console.log("Video session data:", videoSession);
});

// Video synchronization events
socket.on("videoSync", (state) => {
  // Sync local video player with server state
  videoPlayer.currentTime = state.currentTime;
  videoPlayer.playbackRate = state.playbackRate;
  // etc.
});

// Real-time control events
socket.on("videoPlay", (data) => {
  videoPlayer.currentTime = data.timestamp;
  videoPlayer.play();
});

socket.on("videoPause", (data) => {
  videoPlayer.currentTime = data.timestamp;
  videoPlayer.pause();
});

socket.on("videoSeek", (data) => {
  videoPlayer.currentTime = data.timestamp;
});

socket.on("videoVolumeChange", (data) => {
  videoPlayer.volume = data.volume;
});

socket.on("videoRateChange", (data) => {
  videoPlayer.playbackRate = data.rate;
});

// Error handling
socket.on("videoError", (error) => {
  console.error("Video error:", error.message);
});
```

## Usage Example

### Frontend Implementation

```javascript
// Connect to socket with authentication
const socket = io("http://localhost:3000", {
  auth: { token: userJWT }
});

// Join chatroom first
socket.emit("joinRoom", roomId);

// Start video session via API
const startVideoSession = async () => {
  const response = await fetch(`/api/chatroom/${roomId}/video/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userJWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoUrl: "https://example.com/video.mp4",
      title: "Study Session"
    })
  });
  
  const data = await response.json();
  return data.videoSession;
};

// Join video session via socket
socket.emit("joinVideoSession", { roomId });

// Listen for video control events
socket.on("videoPlay", (data) => {
  videoElement.currentTime = data.timestamp;
  videoElement.play();
});

socket.on("videoPause", (data) => {
  videoElement.currentTime = data.timestamp;
  videoElement.pause();
});

// Send control events
const handlePlay = () => {
  socket.emit("videoPlay", {
    roomId: roomId,
    timestamp: videoElement.currentTime
  });
};

const handleSeek = (newTime) => {
  socket.emit("videoSeek", {
    roomId: roomId,
    timestamp: newTime
  });
};
```

## Features

### ✅ Implemented Features
- **Video Session Management**: Start, join, leave, and end video sessions
- **Synchronized Playback**: All participants see the same video state
- **Real-time Controls**: Play, pause, seek, volume, and speed controls
- **User Management**: Track participants and host permissions
- **Session History**: Keep track of past video sessions
- **Permission Control**: Host can control user permissions
- **Error Handling**: Comprehensive error handling and validation
- **Message Integration**: Video events are logged as chat messages

### 🔄 Synchronization Features
- **Play/Pause Sync**: All users play/pause together
- **Seek Sync**: Seeking updates all participants
- **Volume Sync**: Volume changes are synchronized
- **Speed Sync**: Playback rate changes are synchronized
- **State Sync**: New users can request current video state

### 🎛️ Control Features
- **Host Control**: Host can manage session settings
- **User Control**: Users can control playback (if allowed)
- **Control Lock**: Prevent conflicts with control locking
- **Sync Toggle**: Enable/disable synchronization

### 📊 Tracking Features
- **Participant Tracking**: Know who's in the session
- **Event Logging**: All video events are logged
- **Session History**: Previous sessions are stored
- **Usage Analytics**: Track session duration and activity

## Security

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Room Membership**: Users must be chatroom members to join video sessions
- **Host Permissions**: Only hosts can end sessions and change settings
- **Input Validation**: All inputs are validated and sanitized

## Database Relationships

```
Chatroom
├── activeVideoSession (ObjectId → VideoSession)
├── videoSessionHistory ([ObjectId] → VideoSession)
└── members ([ObjectId] → User)

VideoSession
├── chatroom (ObjectId → Chatroom)
├── host (ObjectId → User)
├── participants ([ObjectId] → User)
└── controlLockedBy (ObjectId → User)

Message
├── videoSessionId (ObjectId → VideoSession)
├── videoEvent (Object)
│   ├── type (String: play|pause|seek|volume|rate|join|leave)
│   ├── data (Mixed: event-specific data)
│   └── timestamp (Number: video timestamp)
└── messageType (String: videoSession|videoControl|videoEvent)
```

This implementation provides a robust foundation for collaborative video viewing with real-time synchronization and shared controls.

