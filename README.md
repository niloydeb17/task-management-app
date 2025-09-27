# TaskFlow - Cross-Team Task Management Platform

A modern, intuitive task management tool designed for seamless cross-team collaboration with real-time updates, smart handoffs, and motivation features.

## 🚀 Features

- **Cross-Team Handoffs**: Seamlessly move tasks between design, content, and development teams
- **Real-Time Collaboration**: Live updates, team presence, and instant notifications
- **Google Sheets Integration**: Real-time data synchronization for reporting
- **Team Motivation**: Duolingo-style gamification with streaks and achievements
- **Team-Specific Boards**: Customizable templates for different team workflows
- **Simple & Intuitive**: Clean, modern interface that's easy to learn

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Better Auth
- **File Storage**: Cloudinary
- **Integrations**: Google Sheets API

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudinary account (optional)
- Google Cloud account for Sheets API (optional)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd TaskManagement
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Better Auth Configuration
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000

# Cloudinary Configuration (Optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset_here

# Google Sheets Integration (Optional)
GOOGLE_SHEETS_PRIVATE_KEY=your_google_sheets_private_key_here
GOOGLE_SHEETS_CLIENT_EMAIL=your_google_sheets_client_email_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheets_spreadsheet_id_here
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database migrations (coming soon)
3. Set up Row Level Security policies

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── TeamBoard.tsx     # Main team board component
├── lib/                  # Utility libraries
│   ├── auth.ts           # Better Auth configuration
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
    └── index.ts          # Core types
```

## 🎯 Core Concepts

### Teams
- Each team has a specific type (design, content, development, etc.)
- Teams have customizable board templates
- Teams can hand off tasks to other teams

### Tasks
- Tasks belong to a team and have a status
- Tasks can be moved between columns (drag & drop)
- Tasks support attachments, comments, and tags
- Tasks have priority levels and due dates

### Handoffs
- Tasks can be handed off between teams
- Handoffs include notes, requirements, and files
- Handoff status is tracked (pending, accepted, rejected)

### Real-time Updates
- All changes are synchronized in real-time
- Team members see live updates
- Google Sheets integration keeps data in sync

## 🔧 Development

### Adding New Components

```bash
# Add a new Shadcn UI component
npx shadcn@latest add [component-name]
```

### Database Changes

1. Update types in `src/types/index.ts`
2. Update Supabase schema
3. Update database types in `src/lib/supabase.ts`

### Styling

- Use Tailwind CSS classes
- Follow the design system in `src/app/globals.css`
- Use Shadcn UI components when possible

## 📱 Pages

- **Landing Page** (`/`): Marketing page with features showcase
- **Dashboard** (`/dashboard`): Team overview and quick actions
- **Team Board** (`/team/[id]`): Interactive task board (coming soon)
- **Settings** (`/settings`): Team and user settings (coming soon)

## 🚧 Roadmap

### Phase 1: Foundation ✅
- [x] Project setup with Next.js 15
- [x] Basic UI components with Shadcn UI
- [x] Landing page
- [x] Dashboard page
- [x] Team board component

### Phase 2: Core Features (In Progress)
- [ ] Authentication with Better Auth
- [ ] Database setup with Supabase
- [ ] Real-time task updates
- [ ] Cross-team handoffs
- [ ] File upload with Cloudinary

### Phase 3: Advanced Features
- [ ] Google Sheets integration
- [ ] Team gamification
- [ ] Mobile responsiveness
- [ ] Advanced analytics

### Phase 4: Polish
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@taskflow.com or create an issue in the repository.

---

Built with ❤️ for modern teams who need simplicity without sacrificing power.