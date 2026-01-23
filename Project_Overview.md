# MobieBook / PhotoMate - Project Overview

## 1. Introduction
**MobieBook (also referred to as PhotoMate)** is a comprehensive digital platform designed to modernize the traditional photo album experience. It enables Photographers and Labs to create, manage, and share interactive "Electronic Albums" (E-Albums) with their customers. The system supports rich media features like flip-book effects, background music, and customizable templates.

## 2. Technical Architecture
The project follows a modern distributed architecture comprising a RESTful API backend, a responsive Web Client, and a Desktop Client for heavy-lifting tasks.

### 2.1 Backend (API)
*   **Path**: `/Code/API`
*   **Framework**: .NET 5.0
*   **Type**: REST API
*   **Data Access**: ADO.NET
*   **Database**: SQL Server (Inferred from schema scripts)
*   **Key Responsibilities**:
    *   User Authentication & Authorization.
    *   Data persistence for Albums, Users, Coupons, and Orders.
    *   Serving album metadata and media configurations.

### 2.2 Web Client (WebApp)
*   **Path**: `/Code/WebApp`
*   **Framework**: Angular 11 (`@angular/core`)
*   **UI Library**: Bootstrap 4.5
*   **Key Libraries**:
    *   `flip-book`: Core library for the realistic page-turning effect.
    *   `swiper`: For touch-enabled sliders.
    *   `compressorjs` / `ng2-img-max`: Client-side image optimization.
    *   `bs-stepper`: For wizard-like flows (likely for album creation).
*   **Key Modules**:
    *   **E-Album**: Creation, management, and viewing of digital albums.
    *   **Manage Lab/Photographer**: Administration interfaces for business partners.
    *   **Coupon System**: Marketing and access control.
    *   **Profile**: User settings and management.

### 2.3 Desktop Client (WinApp)
*   **Path**: `/Code/WinApp`
*   **Technology**: Electron 11.3 + Angular 11
*   **Purpose**: A desktop-based application likely used by Photographers or Labs for high-volume tasks.
*   **Special Features**:
    *   **Local File Access**: Uses `directory-tree` to manage local photo collections.
    *   **Offline Capability**: Can likely function with local resources before syncing.
    *   **Excel Export**: Integrated reporting using `exceljs`.
    *   **Cross-Platform**: Built for Windows (`win32`, `x64`).

## 3. Key Features & Business Logic

### Electronic Albums (E-Albums)
The core product is the E-Album. It is not just a gallery but an interactive experience.
*   **Templates**: Supports multiple templates (`template1`, `template2`) for different visual styles.
*   **Multimedia**: Support for background MP3 music to enhance the viewing experience.
*   **Organization**: Albums are composed of pages that can be managed and reordered.

### Ecosystem Roles
Based on the code structure, the system caters to multiple user types:
1.  **Admin/SuperUser**: Global system management.
2.  **Labs**: Printing or processing partners who might manage multiple photographers.
3.  **Photographers**: The primary creators who build albums for their clients.
4.  **Customers**: The end-users who view (`view-album`) the shared albums.

### Commerce & Security
*   **Coupons**: A dedicated module (`coupon-detail`) suggests a business model involving discounts or prepaid access codes.
*   **Validation**: `validate-url` indicates mechanisms to ensure widespread sharing is controlled or that albums are accessed only via valid links.

## 4. Project Structure Overview

```text
Code/
├── API/                    # .NET 5 Backend Solution
│   ├── PhotoMateAPI/       # Main API Project
│   ├── Photomate.Domain/   # Business Logic/Services
│   └── Photomate.Model/    # Data Transfer Objects (DTOs) & Database Models
│
├── WebApp/                 # Angular Web Application
│   ├── src/app/ealbum/     # Core Album Logic
│   ├── src/app/view/       # Main UI Views (Login, Profile, specialized views)
│   └── ...
│
├── WinApp/                 # Electron + Angular Desktop Application
│   ├── src/assets/         # Icons and Static Resources
│   └── ...
│
└── SqlScript/              # Database Setup
    ├── table.sql           # Schema definition (Tables)
    └── Procedure.txt       # Stored Procedures
```

## 5. Development Setup
*   **Web**: Standard Angular CLI commands (`ng serve`, `ng build`).
*   **API**: Standard .NET build (`dotnet build`).
*   **Desktop (WinApp)**:
    *   **Install Dependencies**: `npm install` (inside `/Code/WinApp`)
    *   **Run Application**:
        Due to Node.js v17+ OpenSSL compatibility issues with Angular 11, use the following command in PowerShell:
        ```powershell
        $env:NODE_OPTIONS='--openssl-legacy-provider'; npx ng build --base-href ./; $env:NODE_OPTIONS=''; npx electron .
        ```
    *   **Standard Build**: `npm run electron` (may require `NODE_OPTIONS` check).
