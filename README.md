# Craftech Client - Frontend Application

A modern, real-time chat support dashboard built with Next.js, React, and TypeScript. This application provides agents with a comprehensive interface to manage visitor chats, handle notifications, and provide customer support.

## 🚀 Features

### Core Functionality
- **Real-time Chat Management**: Handle multiple visitor conversations simultaneously
- **Live Notifications**: Server-Sent Events (SSE) for instant visitor arrival alerts
- **Visitor Dashboard**: Comprehensive overview of incoming, active, and closed chats
- **Authentication System**: Secure login with JWT tokens and protected routes
- **Responsive Design**: Modern UI built with shadcn/ui components and Tailwind CSS

### Chat Features
- **Multi-visitor Support**: Manage multiple chat sessions concurrently
- **Message History**: View complete conversation history including pre-agent messages
- **Real-time Updates**: Live chat updates via WebSocket connections
- **Visitor Information**: Access detailed visitor metadata and session details

### Notification System
- **Smart Notifications**: Prevents duplicate notifications with advanced tracking
- **Sound Alerts**: Custom notification sounds for new visitors
- **Action Buttons**: Direct actions (pick visitor) from notification popups
- **Auto-dismiss**: Notifications automatically disappear after 5 seconds

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 15.5.0**: React framework with App Router
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5**: Type-safe development

### UI & Styling
- **shadcn/ui**: Modern component library built on Radix UI
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Beautiful, customizable icons

### State Management & Data
- **React Context API**: Global state management (authentication, notifications)
- **Axios**: HTTP client for API communication
- **Server-Sent Events**: Real-time data streaming
- **WebSocket**: Real-time chat communication

### Development Tools
- **ESLint**: Code linting and formatting
- **Turbopack**: Fast bundler for development
- **PostCSS**: CSS processing

## 📁 Project Structure

```
craftech-client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/         # Protected dashboard routes
│   │   │   ├── visitors/      # Visitor management
│   │   │   │   ├── components/ # Visitor-specific components
│   │   │   │   ├── hooks/     # Custom hooks
│   │   │   │   └── page.tsx   # Main visitors page
│   │   │   ├── history/       # Chat history
│   │   │   └── layout.tsx     # Dashboard layout
│   │   ├── login/             # Authentication page
│   │   ├── Layout/            # Global layout components
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/             # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   └── protected-route.tsx # Route protection component
│   ├── contexts/               # React Context providers
│   │   └── auth-context.tsx   # Authentication context
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utility functions
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd craftech-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🔐 Authentication

The application uses JWT-based authentication with the following flow:

1. **Login**: Users authenticate with email/password
2. **Token Storage**: JWT tokens stored in localStorage
3. **Protected Routes**: Dashboard routes require authentication
4. **Auto-refresh**: Tokens automatically refresh before expiration
5. **Logout**: Clear tokens and redirect to login

### User Types
- **Client Admin**: Full access to all features
- **Agent**: Chat management and visitor handling

## 💬 Chat System

### Visitor Management
- **Incoming Chats**: New visitors waiting for agent assignment
- **Active Chats**: Currently ongoing conversations
- **Closed Chats**: Completed chat sessions

### Real-time Features
- **SSE Connection**: Server-Sent Events for instant updates
- **WebSocket Chat**: Real-time message exchange
- **Live Notifications**: Instant alerts for new visitors
- **Status Updates**: Real-time visitor and chat status changes

## 🎨 UI Components

Built with shadcn/ui components for consistency and accessibility:

- **Cards**: Information display containers
- **Tables**: Data presentation
- **Dialogs**: Modal interactions
- **Buttons**: Action triggers
- **Forms**: Input and validation
- **Notifications**: Alert system
- **Navigation**: Sidebar and breadcrumbs

## 🔌 API Integration

### Endpoints Used
- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user info
- `GET /chat/visitors` - Fetch visitor list
- `POST /chat/take-visitor` - Assign visitor to agent
- `GET /chat/visitor-messages/{visitor_id}` - Get chat history
- `GET /chat/messages/{session_id}` - Get session messages

### Data Flow
1. **Authentication**: Login and token management
2. **Visitor Fetching**: Regular polling and SSE updates
3. **Chat Operations**: Real-time chat management
4. **Status Updates**: Visitor and session state changes

## 🎯 Key Features Implementation

### Duplicate Notification Prevention
- Multi-layer tracking system
- Visitor-specific notification history
- Global debouncing mechanisms
- Unique ID generation
- Automatic cleanup

### Real-time Updates
- Server-Sent Events for visitor arrivals
- WebSocket for chat messages
- Optimistic UI updates
- Error handling and reconnection

### Performance Optimizations
- Debounced API calls
- Efficient state management
- Component memoization
- Lazy loading where appropriate

## 🧪 Testing

The application includes comprehensive error handling and validation:

- **Form Validation**: Client-side input validation
- **Error Boundaries**: Graceful error handling
- **Loading States**: User feedback during operations
- **Network Resilience**: Automatic retry and reconnection

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables
Ensure all required environment variables are set in production:
- API endpoints
- WebSocket URLs
- Authentication settings

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use shadcn/ui components for new UI elements
3. Implement proper TypeScript types
4. Add error handling for all async operations
5. Test thoroughly before submitting changes

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the backend API documentation
- Review the component documentation
- Contact the development team

---

**Built with ❤️ using Next.js, React, and shadcn/ui**
