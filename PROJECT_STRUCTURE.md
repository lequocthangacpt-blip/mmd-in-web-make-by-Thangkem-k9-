# MMD Web Studio - Project Structure

## Overview

This is a **Progressive Web App (PWA)** for viewing, animating, and customizing MikuMikuDance (MMD) 3D models in the browser. Built with **React, TypeScript, Vite, Babylon.js, and TailwindCSS**.

## Project Structure

```
mmd-web-studio/
├── public/                          # Static assets
│   ├── manifest.json               # PWA manifest
│   └── favicon.svg                # App icon
│
├── src/                            # Source code
│   ├── assets/                    # Static assets (images, etc.)
│   │
│   ├── components/                # React components
│   │   ├── BabylonScene.tsx       # Babylon.js 3D rendering component
│   │   ├── FileManager.tsx        # File library manager
│   │   ├── MaterialInspector.tsx   # Material properties panel
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── TimelineController.tsx # Animation timeline
│   │   └── Toolbar.tsx            # Top toolbar
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useDatabase.ts         # IndexedDB persistence hook
│   │   └── useMMDLoader.ts        # MMD file loading hook
│   │
│   ├── lib/                       # Library utilities
│   │   └── mmdLoader.ts           # MMD model/motion loader (babylon-mmd wrapper)
│   │
│   ├── store/                     # State management (Zustand)
│   │   └── sceneStore.ts          # Scene state store
│   │
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts               # All application types
│   │
│   ├── utils/                     # Utility functions
│   │
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles (TailwindCSS)
│   ├── vite-env.d.ts              # Vite type declarations
│   └── service-worker.ts          # PWA service worker
│
├── .gitignore                     # Git ignore rules
├── index.html                     # HTML entry point
├── package.json                   # Project dependencies
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # TailwindCSS configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.app.json              # TypeScript app configuration
├── tsconfig.node.json             # TypeScript node configuration
└── vite.config.ts                 # Vite configuration with PWA plugin
```

## Technology Stack

### Frontend Framework
- **React 19** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### 3D Rendering
- **Babylon.js** - WebGL-based 3D rendering engine
- **babylon-mmd** - MMD (PMX/VMD/VPD) plugin for Babylon.js
- **@babylonjs/core** - Core Babylon.js functionality
- **@babylonjs/gui** - Babylon.js GUI system
- **@babylonjs/loaders** - Asset loading utilities

### Data & Storage
- **Dexie.js** - IndexedDB wrapper for client-side persistence
- **JSZip** - ZIP archive extraction in the browser

### PWA Support
- **vite-plugin-pwa** - PWA plugin for Vite
- **Workbox** - Service worker and caching

## Key Features Implemented

### ✅ Step 1: Project Setup (Completed)
- Vite + React + TypeScript project initialized
- TailwindCSS configured with custom theme
- Babylon.js integrated with canvas setup
- PWA configuration with manifest and service worker

### ✅ Step 2: MMD Parsing Module (Completed)
- **PMX Loader** - Load and parse PMX model files
- **VMD Loader** - Load and parse VMD motion files
- **VPD Loader** - Load and parse VPD pose files
- **ZIP Extraction** - Extract PMX and textures from ZIP archives
- **babylon-mmd Integration** - Use babylon-mmd library for MMD-specific parsing

### ✅ Step 3: Database Persistence (Completed)
- **IndexedDB Setup** - Dexie.js for database management
- **File Storage** - Store models, motions, poses, audio, and backgrounds
- **Texture Storage** - Store model textures separately
- **Database Management** - Clear database functionality
- **Auto-restore** - Automatically restore files on page refresh

### ✅ Step 4: UI Components (Completed)
- **Sidebar** - Navigation with file counts
- **Toolbar** - Quick access controls
- **Timeline Controller** - Play/pause/stop, frame scrubbing
- **Material Inspector** - Material properties and opacity control
- **File Manager** - Library of uploaded files

### 🔄 Step 5: Interaction & Synchronization (In Progress)
- **Camera Controls** - Orbit camera with mouse/touch
- **VMD Camera Mode** - Switch to VMD camera animation
- **Audio Sync** - Synchronize audio playback with animation
- **Gizmo Controls** - Translate and rotate model
- **Touch Gestures** - Mobile-friendly controls

### ⏳ Step 6: Performance Optimization (Planned)
- **Low Expression Mode** - Toggle for mobile performance
- **LOD Handling** - Level of detail management
- **Service Worker Caching** - Cache MMD assets

## Type Definitions

### File Types
```typescript
interface FileEntry {
  id: string;
  name: string;
  type: 'model' | 'motion' | 'pose' | 'audio' | 'background' | 'unknown';
  size: number;
  lastModified: number;
  url?: string;
  data?: ArrayBuffer;
  textures?: Array<{ name: string; url: string; data: Blob }>;
}
```

### MMD Model Types
```typescript
interface PMXModel {
  id: string;
  name: string;
  path: string;
  meshes: PMXMesh[];
  materials: PMXMaterial[];
  morphs: PMXMorph[];
  bones: PMXBone[];
  physics?: PMXPhysics;
}

interface VMDMotion {
  id: string;
  name: string;
  path: string;
  frameCount: number;
  fps: number;
  boneFrames: VMDBoneFrame[];
  morphFrames: VMDMorphFrame[];
  cameraFrames: VMDCameraFrame[];
}
```

## State Management

### Scene State (Zustand Store)
```typescript
interface SceneState {
  model?: PMXModel;
  motion?: VMDMotion;
  pose?: VPDPose;
  audio?: AudioFile;
  background?: BackgroundImage;
  currentFrame: number;
  isPlaying: boolean;
  cameraMode: 'orbit' | 'vmd';
  showFloorGrid: boolean;
  showUI: boolean;
  lowExpressionMode: boolean;
}
```

## Usage

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## Browser Support

- **Desktop**: Chrome, Firefox, Edge, Safari (latest versions)
- **Mobile**: Chrome for Android, Safari for iOS
- **Features**: 
  - WebGL 2.0 required for Babylon.js
  - IndexedDB for file persistence
  - Touch gestures for mobile devices

## Known Limitations

1. **babylon-mmd Dependency**: The `babylon-mmd` library must be loaded. Currently configured to load from CDN if not available globally.

2. **Large Files**: Very large PMX models may cause performance issues on mobile devices. Use Low Expression Mode to improve performance.

3. **Memory**: The app stores files in IndexedDB and creates object URLs. Clearing the database will free up memory.

4. **Offline Use**: After first load, the PWA can work offline for cached files, but new file uploads require internet connection.

## Future Enhancements

- [ ] **Morph Inspector** - View and control facial expressions
- [ ] **Bone Inspector** - View and manipulate bone hierarchy
- [ ] **Lighting Controls** - Adjust scene lighting
- [ ] **Export Options** - Export scenes as images/videos
- [ ] **Model Preview** - Thumbnail previews for models
- [ ] **Animation Mixing** - Combine multiple motions
- [ ] **IK Controls** - Inverse kinematics manipulation
- [ ] **Physics Simulation** - Enable physics for hair/clothes

## License

MIT License - Free for personal and commercial use.
