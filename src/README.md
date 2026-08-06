# Sahaaya - Public Help & Resource Platform

## Overview
Sahaaya is a frontend-only web application that connects Needy Individuals, Volunteers/Donors, and NGOs through a clean, modern interface. The platform features role-based dashboards with a simplified two-role structure.

## Features

### Core Functionality
- **Two User Roles:**
  - Individual Users: Can request help or offer help from the same dashboard
  - NGO Users: Access to NGO-specific tools and campaign management

- **Help Request System:**
  - Submit help requests with category, urgency levels, and location
  - File upload support for documentation
  - Request tracking and status management

- **Browse & Match:**
  - List and map views of help requests
  - Filter by category, urgency, and location
  - Real-time search functionality

- **Dashboard Analytics:**
  - Individual: Track requests, contributions, and impact
  - NGO: Monitor campaigns, beneficiaries, and donations

### Design & Accessibility
- **Color Palette:**
  - Background: #f9fefa
  - Primary Actions: #41695e
  - Headers: #033b4a

- **Modern 3D-Style Elements:**
  - Soft depth effects
  - Gradients and shadows
  - Glassmorphism effects
  - Hover animations

- **Accessibility:**
  - Designed for rural/less tech-savvy users
  - Clean, intuitive navigation
  - Clear visual hierarchy

## Authentication

### Demo Accounts
You can use these demo credentials to test the application:

**Individual User:**
- Email: `demo@individual.com`
- Password: `Demo@123`

**NGO User:**
- Email: `demo@ngo.com`
- Password: `Demo@123`

### Create New Account
1. Click "Sign up here" on the login page
2. Select your role (Individual or NGO)
3. Fill in your details
4. Note: Email confirmation is simulated in this frontend-only version

## Data Storage

This is a **frontend-only** application. All data is stored in the browser's localStorage:

- `sahaaya_session`: Current user session
- `sahaaya_users`: Registered users
- `sahaaya_requests`: Help requests

**Note:** Data will be lost if you clear your browser's localStorage.

## Technology Stack

- **Framework:** React with TypeScript
- **Styling:** Tailwind CSS v4.0
- **UI Components:** shadcn/ui
- **Icons:** lucide-react
- **Forms:** React Hook Form
- **Maps:** Custom MapView component
- **Authentication:** localStorage-based (frontend only)

## Project Structure

```
/
├── components/
│   ├── ui/                    # shadcn UI components
│   ├── Communities/           # Community features
│   ├── Dashboard.tsx          # Main dashboard
│   ├── HelpRequestForm.tsx    # Help request submission
│   ├── MatchingScreen.tsx     # Browse requests
│   ├── Login.tsx              # Login page
│   ├── Register.tsx           # Registration page
│   ├── Navigation.tsx         # Main navigation
│   └── ...                    # Other components
├── utils/
│   └── auth.ts               # Frontend authentication
├── styles/
│   └── globals.css           # Global styles and tokens
└── App.tsx                   # Main app component
```

## Important Notes

1. **Frontend Only:** This application does not connect to any backend services. All functionality is simulated using localStorage.

2. **No Real Database:** Data persistence is limited to browser localStorage. Clearing browser data will reset the application.

3. **OAuth Not Available:** Google Sign-in and other OAuth methods are disabled in this frontend-only version.

4. **Demo Purposes:** This is a demonstration/prototype application. For production use, integrate with a proper backend service.

## Future Enhancements

To make this production-ready, consider adding:
- Backend API (Node.js, Python, etc.)
- Database (PostgreSQL, MongoDB, etc.)
- Real authentication (Auth0, Supabase, Firebase)
- File storage service (AWS S3, Cloudinary)
- Email service for notifications
- Payment gateway integration
- Mobile app versions

## Support

For demo purposes, the app includes a simulated support helpline: **1800-SAHAAYA**

## License

This is a demonstration project created with Figma Make.
