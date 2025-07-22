# WhatsApp Clone - Backend API

<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About WhatsApp Clone

A real-time messaging application built with Laravel backend and React frontend, featuring:

- **Real-time messaging** with WebSocket support
- **User authentication** and authorization
- **Private and group chats**
- **Message reactions** with emoji support
- **Message replies** and forwarding
- **Message search** functionality
- **File sharing** capabilities
- **Online/offline status**
- **Message read receipts**

## Features

### Core Messaging
- ✅ Real-time message sending and receiving
- ✅ Private and group chat support
- ✅ Message reactions (👍, ❤️, 😂, etc.)
- ✅ Message replies and threading
- ✅ Message forwarding to other chats
- ✅ Message deletion (for me/for everyone)

### User Management
- ✅ User registration and authentication
- ✅ JWT token-based authentication
- ✅ User profile management
- ✅ Online/offline status tracking

### Advanced Features
- ✅ Message search functionality
- ✅ File upload and sharing
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Message timestamps
- ✅ Chat history

## Technology Stack

### Backend
- **Laravel 10** - PHP framework
- **Laravel Echo Server** - WebSocket server for real-time features
- **MySQL** - Database
- **JWT** - Authentication
- **Redis** - Caching and session storage

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Laravel Echo** - WebSocket client
- **Axios** - HTTP client

## Installation & Setup

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 16+
- MySQL 8.0+
- Redis (optional, for caching)

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
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

4. **Configure database**
```bash
# Edit .env file with your database credentials
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=whatsapp_clone
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

5. **Run migrations**
```bash
php artisan migrate
```

6. **Seed database (optional)**
```bash
php artisan db:seed
```

7. **Start Laravel server**
```bash
php artisan serve
```

### Laravel Echo Server Setup

Laravel Echo Server is required for real-time features like instant messaging, typing indicators, and online status.

1. **Install Laravel Echo Server globally**
```bash
npm install -g laravel-echo-server
```

2. **Initialize Echo Server**
```bash
laravel-echo-server init
```

3. **Configure Echo Server**
Edit `laravel-echo-server.json`:
```json
{
  "authHost": "http://localhost:8000",
  "authEndpoint": "/broadcasting/auth",
  "clients": [
    {
      "appId": "your-app-id",
      "key": "your-app-key"
    }
  ],
  "database": "redis",
  "databaseConfig": {
    "redis": {},
    "sqlite": {
      "databasePath": "/database/laravel-echo-server.sqlite"
    }
  },
  "devMode": true,
  "host": null,
  "port": "6001",
  "protocol": "http",
  "socketio": {},
  "sslCertPath": "",
  "sslKeyPath": "",
  "sslCertChainPath": "",
  "sslPassphrase": "",
  "subscribers": {
    "http": true,
    "redis": true
  },
  "apiOriginAllow": {
    "allowCors": true,
    "allowOrigin": "http://localhost:3000",
    "allowMethods": "GET, POST",
    "allowHeaders": "Origin, Content-Type, X-Auth-Token, X-Requested-With, Accept, Authorization, X-CSRF-TOKEN, X-Socket-Id"
  }
}
```

4. **Start Echo Server**
```bash
laravel-echo-server start
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_ECHO_HOST=http://localhost:6001
VITE_ECHO_APP_ID=your-app-id
VITE_ECHO_APP_KEY=your-app-key
```

4. **Start development server**
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Chat Endpoints
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/{id}/messages` - Get chat messages
- `POST /api/chats/{id}/messages` - Send message

### Message Endpoints
- `POST /api/messages/{id}/reactions` - Add reaction
- `DELETE /api/messages/{id}/reactions/{reactionId}` - Remove reaction
- `PUT /api/messages/{id}/reactions/{reactionId}` - Update reaction
- `DELETE /api/messages/{id}` - Delete message

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile

## Real-time Events

The application uses Laravel Echo Server for real-time communication:

### Broadcasting Events
- `MessageSent` - When a new message is sent
- `ReactionAdded` - When a reaction is added
- `ReactionRemoved` - When a reaction is removed
- `UserTyping` - When user is typing
- `UserOnline` - When user comes online
- `UserOffline` - When user goes offline

### WebSocket Channels
- `chat.{chatId}` - Private channel for each chat
- `user.{userId}` - Private channel for user events

## Development

### Running Tests
```bash
php artisan test
```

### Code Style
```bash
composer run-script phpcs
```

### Database Migrations
```bash
php artisan make:migration create_new_table
php artisan migrate
```

## Production Deployment

### Environment Variables
Set the following in production:
```env
APP_ENV=production
APP_DEBUG=false
BROADCAST_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Echo Server Production
```bash
# Install PM2 for process management
npm install -g pm2

# Start Echo Server with PM2
pm2 start laravel-echo-server.json

# Save PM2 configuration
pm2 save
pm2 startup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

---

**Built with ❤️ using Laravel and React**
