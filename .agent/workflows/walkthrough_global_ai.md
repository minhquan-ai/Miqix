---
description: How to use the Global AI and Split View features
---

# Global AI & Split View Walkthrough

## Overview
We have unified the AI experience across the application.
- **Global AI (Floating Button)**: Accessible on all pages.
  - On **Dashboard**: Toggles the "Split View" (expands/collapses the Omni-Canvas).
  - On **Other Pages**: Opens a slide-out panel for quick assistance (Learning, Schedule context aware).

## How to Test

### 1. Global AI (Context Aware)
1. Navigate to "Bài tập" (Assignments) or "Lịch biểu" (Schedule).
2. Look for the floating "Sparkles" button in the bottom right.
3. Click it to open the AI Panel.
   - On Assignments page: It loads "Learning Mode".
   - On Schedule page: It loads "Schedule Mode".

### 2. Dashboard Split View
1. Navigate to the main "Dashboard" (Miqix AI).
2. The floating "Sparkles" button works as the **Split View Toggle**.
3. Click the button.
4. The screen splits: Chat on the left, Omni-Canvas on the right.
5. Click it again to close.

## underlying Architecture
- **State Management**: `AIContext` manages the `isCanvasOpen` visibility state globally.
- **AIPlayground**: Consumes `AIContext` to expand/collapse the canvas area.
- **AIButler**: Detects dashboard route and switches behavior from "Open Panel" to "Toggle Canvas".
