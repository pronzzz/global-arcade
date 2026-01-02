# Global Arcade 🎮

![Global Arcade Landing Page](/Users/pranavdwivedi/.gemini/antigravity/brain/a144284e-635b-4f62-8e4a-fb9736fa9163/landing_page_1767313143969.png)

A real-time multiplayer arcade platform built with **React**, **Vite**, **Tailwind CSS**, and **Firebase**. Play classic board games with friends instantly via a shared link. No sign-up required!

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg?style=for-the-badge&logo=firebase)](https://global-arcade-app.web.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

## 🕹️ Games

### Tic-Tac-Toe
The classic game of X's and O's. Real-time updates and win detection.

![Tic Tac Toe Gameplay](/Users/pranavdwivedi/.gemini/antigravity/brain/a144284e-635b-4f62-8e4a-fb9736fa9163/game_tictactoe_1767313163387.png)

### Chess (Simplified)
A 2-player chess board with move validation for all pieces.

![Chess Gameplay](/Users/pranavdwivedi/.gemini/antigravity/brain/a144284e-635b-4f62-8e4a-fb9736fa9163/game_chess_1767313204431.png)

### Snakes & Ladders
Race to 100! Complete with snakes, ladders, and dice rolling animations.

![Snakes Gameplay](/Users/pranavdwivedi/.gemini/antigravity/brain/a144284e-635b-4f62-8e4a-fb9736fa9163/game_snakes_1767313255717.png)

## 🚀 Features

-   **Instant Multiplayer**: Create a room and share the link to play.
-   **Anonymous Auth**: Frictionless entry using Firebase Anonymous Auth.
-   **Real-time Sync**: Powered by Firestore `onSnapshot` for millisecond-latency updates.
-   **Responsive Design**: precise UI built with Tailwind CSS for mobile and desktop.
-   **Dark Mode**: Sleek, modern dark aesthetic.

## 🛠️ Technology Stack

-   **Frontend**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Backend**: Firebase (Authentication, Firestore, Hosting)
-   **Icons**: Lucide React

## 📦 Installation

To run this project locally:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/pronzzz/global-arcade.git
    cd global-arcade
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Firebase**
    -   Create a project at [firebase.google.com](https://firebase.google.com)
    -   Enable **Authentication** (Anonymous)
    -   Enable **Firestore Database** (Test mode)
    -   Copy your config object and update `src/App.jsx`

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for gamers.*
