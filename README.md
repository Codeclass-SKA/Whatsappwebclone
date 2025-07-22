# WhatsApp Clone

A modern, real-time messaging application built with React.js, TypeScript, and Laravel 11.

## 🚀 Features

### Core Messaging
- **Real-time Chat** - Instant messaging with WebSocket support
- **Private & Group Chats** - Create and manage conversations
- **Message Reactions** - React to messages with emojis
- **Message Search** - Search through chat history
- **Reply & Forward** - Reply to specific messages or forward to other chats
- **Message Deletion** - Delete messages for yourself or everyone

### User Management
- **User Registration & Login** - Secure authentication with JWT
- **User Profiles** - Customizable profiles with avatars
- **Online Status** - Real-time online/offline indicators
- **User Search** - Find and add users to chats

### Advanced Features
- **Message Polling** - Fallback for real-time updates
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Keyboard Shortcuts** - Quick navigation and actions
- **Network Access** - Access from other devices in the same network

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **Laravel 11** - Modern PHP framework
- **SQLite** - Lightweight database (development)
- **MySQL/PostgreSQL** - Production database ready
- **JWT Authentication** - Secure token-based auth
- **Laravel Echo** - WebSocket support (Pusher)
- **PHPUnit** - Testing framework

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PHP 8.2+
- Composer
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Codeclass-SKA/Whatsappwebclone.git whatsapp-clone
   cd whatsapp-clone/backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database setup**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

5. **Start the server**
   ```bash
   php artisan serve --host=127.0.0.1 --port=8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Local: http://localhost:3000
   - Network: http://[your-ip]:3000

## 🔧 Configuration

### Frontend Configuration
The frontend is configured to proxy API calls to the backend automatically. No additional configuration needed for development.

### Backend Configuration
Update `.env` file for production:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=whatsapp_clone
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

## 🎯 Usage

### Basic Usage
1. **Register** a new account or **Login** with existing credentials
2. **Create a chat** with another user or start a group chat
3. **Send messages** and use reactions
4. **Search messages** using Ctrl+F or the search button
5. **Reply or forward** messages as needed

### Keyboard Shortcuts
- `Ctrl+F` - Open message search
- `Ctrl+↓` - Jump to latest messages
- `Esc` - Clear reply or close modals
- `↑↓` - Navigate search results
- `Enter` - Select search result

### Network Access
To access from other devices in the same network:
1. Frontend automatically runs on `0.0.0.0:3000`
2. Use your computer's IP address: `http://[your-ip]:3000`
3. All API calls are proxied through the frontend server

## 🧪 Testing

### Backend Tests
```bash
cd backend
php artisan test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
whatsapp-clone/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   └── ...
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── public/
│   └── package.json
└── README.md
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **CORS Protection** - Cross-origin request protection
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Protection** - Laravel's Eloquent ORM
- **XSS Protection** - React's built-in XSS protection

## 🚀 Deployment

### Production Deployment
1. **Backend**: Deploy to Laravel Forge, Heroku, or VPS
2. **Frontend**: Build and deploy to Netlify, Vercel, or static hosting
3. **Database**: Use MySQL or PostgreSQL in production
4. **WebSocket**: Configure Laravel Echo with Pusher or Redis

### Environment Variables
Set appropriate environment variables for production:
- Database credentials
- JWT secret
- WebSocket configuration
- File storage settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Riska Abdullah**
- Email: alternative.xen@gmail.com
- GitHub: machineska

## 🙏 Acknowledgments

- Laravel team for the amazing framework
- React team for the powerful frontend library
- Tailwind CSS for the utility-first CSS framework
- All contributors and testers

## 📝 Changelog

### Version 1.0.0 (2025-07-22)
- ✨ Initial release
- 🚀 Real-time messaging with WebSocket support
- 💬 Private and group chat functionality
- 😀 Message reactions with emojis
- 🔍 Message search functionality
- 📱 Responsive design for all devices
- 🔐 JWT authentication system
- ⚡ Network access from other devices
- 🎯 Keyboard shortcuts for better UX
- 🧪 Comprehensive testing setup

---

**Made with ❤️ by Riska Abdullah** 