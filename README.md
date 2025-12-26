# AI Nurse Copilot Survey Platform

A comprehensive survey platform for validating the AI Nurse Copilot concept with adaptive questionnaires for nurses and doctors.

## 🚀 Features

- **Role-based Surveys**: Separate comprehensive questionnaires for nurses (56 questions) and doctors (39 questions)
- **Conditional Logic**: Questions appear/hide based on previous answers
- **Beautiful UI**: Dark theme with glassmorphism effects, mobile-first responsive design
- **Admin Dashboard**: Complete management interface with analytics
- **Docker Ready**: Production-ready containerized deployment

## 📋 Tech Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React

## 🛠️ Quick Start

### Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the survey and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

### Admin Login

- **Default Password**: `admin123`

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the image
docker-compose build

# Start the container
docker-compose up -d

# Seed the database (first time only)
docker-compose exec survey-app npx prisma db push
docker-compose exec survey-app npx tsx prisma/seed.ts
```

### Environment Variables

Create a `.env` file or pass via docker-compose:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
ADMIN_PASSWORD=your-secure-password
TOKEN_SECRET=your-secret-key
```

## 📁 Project Structure

```
nurse-survey/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── login/      # Admin login
│   │   │   ├── questions/  # Question management
│   │   │   ├── analytics/  # Survey analytics
│   │   │   ├── sessions/   # Session viewer
│   │   │   └── settings/   # App settings
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Main survey page
│   ├── components/
│   │   └── survey/         # Survey UI components
│   └── lib/                # Utilities and types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Question data
├── Dockerfile             # Production build
└── docker-compose.yml     # Container orchestration
```

## 📊 Admin Dashboard

The admin panel includes:

- **Dashboard**: Overview with stats and recent activity
- **Questions**: List, search, filter, edit, and delete questions
- **Analytics**: Response statistics and visualizations
- **Sessions**: View and export survey responses
- **Settings**: Password management and database operations

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/questions` | GET | List all questions |
| `/api/questions` | POST | Create a question |
| `/api/questions/[id]` | PUT | Update a question |
| `/api/questions/[id]` | DELETE | Delete a question |
| `/api/sessions` | GET | List sessions |
| `/api/sessions` | POST | Create a session |
| `/api/sessions/[id]` | PATCH | Complete a session |
| `/api/responses` | POST | Submit a response |
| `/api/analytics` | GET | Get analytics data |
| `/api/admin/auth` | POST | Admin login |

## 📱 Survey Flow

1. **Role Selection**: User selects Nurse or Doctor
2. **Survey Questions**: Adaptive questions based on role and previous answers
3. **Progress Tracking**: Visual progress bar and section indicators
4. **Completion**: Celebration screen with statistics

## 🔒 Security Notes

For production deployment:

1. Change the default admin password
2. Use a strong TOKEN_SECRET
3. Enable HTTPS (use reverse proxy like nginx)
4. Regular database backups

## 📄 License

MIT License
