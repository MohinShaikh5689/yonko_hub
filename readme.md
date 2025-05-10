# 🌊 YonkoHub - Ultimate Anime Community Platform

<div align="center">
  
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-13.x-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-blue?logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?logo=socket.io)](https://socket.io/)

</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🤖 AI Integration](#-ai-integration)
- [🏗️ Project Structure](#️-project-structure)
- [�‍💻 Technology Stack](#-technology-stack)
- [�🚀 Installation](#-installation)
  - [Frontend](#frontend-yonko_hub)
  - [Backend](#backend-mugiwara_hub_backend)
  - [API Service](#api-service-apiconsumetorg)
  - [Proxy Server](#proxy-server)
- [💻 Usage](#-usage)
- [🔌 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🔄 Contributing](#-contributing)
- [📜 License](#-license)
- [🤝 Support & Community](#-support--community)
- [👨‍💻 Authors](#-authors)
- [🙏 Acknowledgments](#-acknowledgments)

## 🌟 Overview

YonkoHub is the ultimate platform for anime enthusiasts, offering a comprehensive suite of features including high-quality anime streaming, vibrant community forums, personalized watchlists, and AI-driven recommendations. Built with modern technologies like Next.js, TypeScript, and Node.js, YonkoHub provides a seamless experience for discovering, watching, and discussing anime content.

The platform aggregates content from multiple providers through a custom implementation of the Consumet API, ensuring a vast library of anime titles. Real-time social features enable users to connect with fellow fans, create and join topic-specific communities, and engage in discussions about their favorite series.

## ✨ Features

- **🎬 Anime Streaming** - Watch your favorite anime shows and movies in high quality with support for multiple video qualities, subtitles, and playback options. Our proxy server ensures smooth streaming without buffering issues.

- **👥 Community Forums** - Create and join communities to discuss anime with like-minded fans. Each community has its own chat room, member management, and customizable settings. Community admins can moderate discussions and manage members.

- **💬 Private Messaging** - Connect with other anime enthusiasts through our real-time messaging system powered by Socket.io. Share recommendations and discuss your favorite series one-on-one.

- **📋 Personalized Watchlists** - Keep track of what you're watching, plan to watch, and have completed. Get notified when new episodes of your favorite shows are available.

- **🤖 AI Recommendations** - Get personalized anime recommendations based on your watchlist and viewing history using our advanced AI recommendation engine powered by Google's Gemini model.

- **👫 Friends System** - Add friends, see their watchlists, and share recommendations directly with them.

- **🔍 Advanced Search** - Find exactly what you're looking for with our powerful search functionality. Filter by genre, year, status, rating, and more.

- **📱 Responsive Design** - Enjoy YonkoHub on any device with our mobile-friendly interface. The adaptive layout ensures a great experience on smartphones, tablets, and desktops.

- **🔒 User Authentication** - Secure account management system with JWT authentication, password encryption, and profile customization.

- **🌙 Dark Mode** - Easy on the eyes during those late-night anime binges with our thoughtfully designed dark theme.

## 🤖 AI Integration

YonkoHub incorporates advanced AI technologies to enhance the user experience, particularly in content recommendations and search functionalities:

- **Recommendation Engine** - We've implemented Google's Gemini 1.5 Flash model to analyze users' watchlists and provide personalized anime recommendations. The backend integration is fully functional and can generate tailored recommendations based on viewing history.

- **Content Analysis** - Our AI system can identify themes, character archetypes, and storytelling patterns to match users with anime they're likely to enjoy.

- **Current Limitations** - While the AI recommendation system is fully implemented in the backend (see `mugiwara_hub_backend/src/controllers/watchlistController.ts`), it is currently not fully integrated into the frontend application due to:
  - Rate limiting issues with the AI API
  - Need for additional training data to improve recommendation quality
  - UI/UX refinements required to properly display AI-generated recommendations

We plan to fully integrate the AI features in future updates once these limitations are addressed.

## 🏗️ Project Structure

The YonkoHub project consists of four main components:

```
YonkoHub/
├── yonko_hub/                # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js pages and routing
│   │   ├── components/       # Reusable UI components
│   │   └── lib/              # Utility functions and hooks
├── yonko_hub_backend/     # Node.js backend server
│   ├── src/
│   │   ├── controllers/      # Business logic handlers
│   │   ├── routes/           # API endpoint definitions
│   │   ├── middleware/       # Request processing middlewares
│   │   └── utils/            # Utility functions
├── api.consumet.org/         # Anime content API (based on Consumet)
│   ├── src/
│   │   ├── routes/           # API routes for different providers
│   │   └── providers/        # Data source implementations
└── Proxy_server/             # Media proxy server for streaming
    ├── server.js             # Main proxy server code
    └── scrapper.js           # Content extraction utilities
```

## 👨‍💻 Technology Stack

- **Frontend:**
  - Next.js 13.x (React framework)
  - TypeScript 5.x
  - TailwindCSS (styling)
  - Socket.io-client (real-time communication)
  - Framer Motion (animations)
  - VideoJS (video player)

- **Backend:**
  - Node.js 18.x
  - Express.js
  - TypeScript
  - Prisma ORM 6.x
  - JWT for authentication
  - Socket.io for real-time features
  - Google Gemini AI for recommendations

- **Database:**
  - PostgreSQL (primary database)
  - Redis (caching for API responses)

- **APIs & Services:**
  - Consumet API (anime content)
  - Google Generative AI (recommendations)
  - Cloudinary (image hosting)

- **DevOps & Deployment:**
  - Railway.app for backend hosting
  - Vercel for frontend hosting
  - Redis Cloud for caching

## 🚀 Installation

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL database
- Redis (optional, for enhanced caching)
- Docker (optional, for containerized deployment)
- Google API credentials for AI features

### Frontend (yonko_hub)

```bash
# Clone the repository
git clone https://github.com/MohinShaikh5689/yonko_hub
cd YonkoHub/yonko_hub

# Install dependencies
npm install
# or
yarn install

# Create .env file (copy from example)
cp .env.example .env

# Start development server
npm run dev
# or
yarn dev
```

The frontend will be available at http://localhost:3000

### Backend (mugiwara_hub_backend)

```bash
cd YonkoHub/mugiwara_hub_backend

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp example.env .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
# or
yarn dev
```

Required environment variables for backend:
```
DATABASE_URL=postgresql://username:password@localhost:5432/yonkohub
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
```

The backend server will run on http://localhost:3001

### API Service (api.consumet.org)

```bash
cd YonkoHub/api.consumet.org

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp example.env .env
# Edit .env with your configuration

# Start the API server
npm start
# or
yarn start
```

The API service will run on http://localhost:4000 (or your configured port)

#### Docker Alternative

```bash
cd YonkoHub/api.consumet.org

# Build and run with Docker
docker build -t yonkohub-api .
docker run -p 4000:4000 yonkohub-api
```

### Proxy Server

```bash
cd YonkoHub/Proxy_server

# Install dependencies
npm install
# or
yarn install

# Set up Redis (optional)
# Edit server.js to configure Redis connection

# Start the proxy server
node server.js
```

The proxy server will run on http://localhost:5000

## 💻 Usage

After installing and starting all components:

1. Access the web application at `http://localhost:3000`
2. Create an account or login
3. Explore anime titles, join communities, and build your watchlist
4. Get personalized recommendations based on your watch history
5. Join or create communities to discuss with other fans
6. Add friends and message them directly

### Key User Flows

- **Discovering Anime**: Browse the homepage for trending anime, or use the search feature to find specific titles
- **Watching Content**: Click on an anime to view details, then select an episode to start streaming
- **Community Engagement**: Join existing communities or create your own, then participate in discussions
- **Friend Connections**: Find other users and add them as friends to see their activity and message them

## 🔌 API Documentation

The YonkoHub platform consists of multiple APIs:

### Backend API

The backend API handles user authentication, social features, watchlists, and more:

- **Authentication**
  - `POST /api/users/register` - Create a new user account
  - `POST /api/users/login` - Authenticate and receive JWT
  - `GET /api/users/profile` - Get current user profile

- **Communities**
  - `POST /api/community/create` - Create a new community
  - `GET /api/community` - List all communities
  - `GET /api/community/:communityId` - Get community details
  - `GET /api/community/members/:communityId` - Get community members
  - `POST /api/community/chat` - Send a message to community chat

- **Friends**
  - `GET /api/friend/list` - Get user's friends list
  - `POST /api/friend/add` - Send friend request
  - `PUT /api/friend/status` - Accept/reject friend request

- **Watchlist**
  - `POST /api/watchlist/add` - Add anime to watchlist
  - `GET /api/watchlist` - Get user's watchlist
  - `DELETE /api/watchlist/:id` - Remove anime from watchlist
  - `GET /api/watchlist/recommendations` - Get AI-powered recommendations

### Anime API (Consumet)

For the anime content API (based on Consumet), please refer to the [official documentation](https://docs.consumet.org). 

Key API endpoints:

- `GET /meta/anilist/{query}` - Search for anime by title
- `GET /meta/anilist/info/{id}` - Get detailed anime information
- `GET /anime/{provider}/watch?episodeId={id}` - Get episode streaming links

### Proxy Server API

- `GET /api/search/{query}` - Search for anime titles with caching
- `GET /api/info/{id}` - Get anime details with caching
- `GET /api/episodes/{id}` - Get episode list for an anime with caching
- `GET /api/stream` - Get streaming URLs for episodes
- `GET /api/proxy` - Proxy media content with referrer spoofing

## 🧪 Testing

```bash
# Run frontend tests
cd yonko_hub
npm test

# Run backend tests
cd mugiwara_hub_backend
npm test
```

## 🚢 Deployment

### Vercel (Frontend)

The frontend can be easily deployed on Vercel:

```bash
cd yonko_hub
vercel
```

### Railway (Backend)

```bash
cd yonko_hub_backend
railway up
```

### Docker (All Components)

A Docker Compose file is provided to deploy the entire stack:

```bash
docker-compose up -d
```

The Docker deployment includes:
- Frontend container
- Backend API container
- Consumet API container
- Proxy server container
- PostgreSQL database
- Redis cache

## 🔄 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and naming conventions
- Write unit tests for new features
- Keep components small and focused
- Document any new API endpoints or UI components
- Test on multiple browsers and devices before submitting

## 📜 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Support & Community

You can also:
- Report bugs through GitHub Issues
- Request features through GitHub Discussions
- Follow development updates on Twitter

## 👨‍💻 Authors

- **Your Name** - *Mohin shaikh* - [Your GitHub](https://github.com/MohinShaikh5689)

## 🙏 Acknowledgments

- [Consumet API](https://github.com/consumet/consumet.ts) for the anime content API
- [Next.js](https://nextjs.org/) for the frontend framework
- [Prisma](https://www.prisma.io/) for the database ORM
- [Google Generative AI](https://deepmind.google/) for AI recommendation capabilities
- [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/) for anime metadata
- All contributors and supporters of the project

---

<p align="center">
  Made with ❤️ for anime fans everywhere
</p>
