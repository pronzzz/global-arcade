# Global Arcade - Setup & Deployment Guide

This guide covers how to set up the Global Arcade project from scratch, configure Firebase, and deploy it to the web.

## Prerequisites

-   **Node.js** (v18+ recommended)
-   **npm** (comes with Node)
-   **Google Account** (for Firebase)

## 1. Local Setup

If you have downloaded the source code:

1.  Open your terminal in the project folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local dev server:
    ```bash
    npm run dev
    ```
4.  Open the link shown (usually `http://localhost:5173`).

## 2. Firebase Configuration

The app relies on Firebase for real-time data.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project** and give it a name (e.g., "Global Arcade").
3.  **Register App**:
    -   Click the Web icon (`</>`) on the dashboard.
    -   Nickname: "Arcade Web".
    -   Check **"Also set up Firebase Hosting"**.
    -   Click **Register**.
4.  **Authentication**:
    -   Go to **Build** > **Authentication**.
    -   Click **Get Started**.
    -   Select **Anonymous** and enable it.
5.  **Database**:
    -   Go to **Build** > **Firestore Database**.
    -   Click **Create Database**.
    -   Choose a location near you.
    -   Select **Start in Test Mode** (allows read/write for 30 days).

## 3. Configuration Code

Open `src/App.jsx` and look for the `firebaseConfig` object. Update it with your keys from the Firebase Console (Project Settings > General > Your apps).

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
```

## 4. Deployment

To publish your game to the world:

1.  **Install Firebase Tools** (if not installed):
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login**:
    ```bash
    firebase login
    ```
3.  **Initialize**:
    ```bash
    firebase init
    ```
    -   Select **Hosting**.
    -   Select **Use an existing project** (choose the one you made).
    -   Public directory: `dist`
    -   Single-page app: **Yes**
    -   Overwrite index.html? **No** (if asked)
4.  **Build & Deploy**:
    ```bash
    npm run build
    firebase deploy
    ```

Your app will be live at `https://<your-project-id>.web.app`!
