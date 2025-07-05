# Briv AI - Personal Wellness Reflection App

A full-stack application for personal wellness tracking through reflections and AI-powered insights.

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Python Flask with PostgreSQL
- **Database**: PostgreSQL with comprehensive logging
- **AI**: Integrated AI services for insights generation

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL database

### 1. Clone and Install Dependencies

\`\`\`bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
\`\`\`

### 2. Database Setup

Create a PostgreSQL database and update the connection string in `backend/.env`:

\`\`\`env
DATABASE_URL=postgresql://username:password@localhost:5432/briv_ai
\`\`\`

### 3. Environment Configuration

Copy and configure environment files:

\`\`\`bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp .env.local.example .env.local
\`\`\`

### 4. Start Development Servers

Option 1 - Use the startup script:
\`\`\`bash
chmod +x start-dev.sh
./start-dev.sh
\`\`\`

Option 2 - Start manually:
\`\`\`bash
# Terminal 1 - Python Backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2 - Next.js Frontend
npm run dev
\`\`\`

## Services

- **Frontend**: http://localhost:3000
- **Python API**: http://localhost:5000
- **Health Check**: http://localhost:3000/api/health

## Logging

The application includes comprehensive logging:

- **Frontend logs**: `logs/` directory
- **Backend logs**: `backend/logs/` directory
- **Console output**: Real-time logging in development

View logs in real-time:
\`\`\`bash
npm run logs:view
\`\`\`

## Database Connectivity

The Python backend includes detailed database connectivity logging:

1. **Connection Status**: Logged on startup
2. **Query Execution**: All database queries are logged
3. **Error Handling**: Database errors are captured and logged
4. **Health Checks**: Database status available via `/health` endpoint

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Reflections
- `GET /api/reflections` - Get user reflections
- `POST /api/reflections` - Create new reflection

### Assessments
- `POST /api/assessments/questions` - Generate assessment questions
- `POST /api/assessments` - Submit assessment

### Insights
- `POST /api/insights/generate` - Generate AI insights

### System
- `GET /health` - System health check

## Troubleshooting

### Database Connection Issues

1. Check database is running:
   \`\`\`bash
   pg_isready -h localhost -p 5432
   \`\`\`

2. Verify connection string in `backend/.env`

3. Check backend logs:
   \`\`\`bash
   tail -f backend/logs/app.log
   \`\`\`

### API Connection Issues

1. Verify Python backend is running on port 5000
2. Check frontend environment variables in `.env.local`
3. Review API client logs in browser console

## Development

The application uses a proxy pattern where Next.js API routes forward requests to the Python backend, allowing for:

- Centralized database operations in Python
- Comprehensive logging on both ends
- Easy debugging and monitoring
- Scalable architecture
