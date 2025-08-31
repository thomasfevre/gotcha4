# Gotcha - Share Your Ideas

A modern social platform where users can share project ideas and other inspire from it.  

Live at : [Gotcha](https://gotcha4.vercel.app/)

## Mission

**I am building something different.** Gotcha isn't about monetization, ads, or data harvesting. It's about fostering genuine collaboration and helping people create useful things together.

In a world full of commercialized, ad-filled platforms designed to extract value from users, Gotcha stands as an authentic alternative. I believe in the power of open collaboration, where ideas flow freely and people connect around shared creativity rather than engagement metrics.

**The "Why":**
- **Foster Collaboration**: Connect creators, developers, and visionaries who want to build meaningful projects
- **Authentic Sharing**: No algorithms designed to maximize ad revenue - just genuine idea discovery
- **Open Innovation**: Ideas should be shared, improved, and built upon by the community
- **Creator-First**: The platform serves the creators, not advertisers or data brokers

You can join me building a platform that puts creativity and collaboration first. Every contribution, no matter how small, helps create a better space for innovators worldwide.

--- 
 

## Features

- **Authentication**: Secure login with Privy (email, Google, Twitter, Discord, Github, Passkeys)
- **Smart Feed Algorithm**: Engagement-based ranking that surfaces quality content while maintaining freshness and diversity
- **Social Feed**: Vertical scrolling feed with infinite scroll and intelligent content discovery
- **Create Posts**: Share Ideas with title, description, images, and categories
- **Interactions**: Like, comment, and share Ideas
- **Search**: Find Ideas by keywords and filter by categories
- **Profile**: View your posts and activity statistics
- **Neumorphic Design**: Modern, tactile UI with soft shadows and depth

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: Privy.io
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with neumorphic design
- **State Management**: TanStack Query
- **Validation**: Zod
- **UI Components**: Custom neumorphic components + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/pnpm/yarn
- Supabase account
- Privy account

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd gotcha-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`


1. Set up the database:
Run the SQL scripts in the `scripts/` folder in order to set up your Supabase database.

1. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
gotcha-app/
├── app/                    # Next.js App Router
│   ├── (tabs)/            # Main app with tab navigation
│   │   ├── feed/          # Social feed
│   │   ├── search/        # Search functionality
│   │   ├── create/        # Create annoyance
│   │   └── profile/       # User profile
│   ├── api/               # API routes
│   └── username/          # Username selection
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── *.tsx             # Feature components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── providers/            # Context providers
├── scripts/              # Database scripts
└── store/                # Zustand stores
```

## Key Features

### Authentication Flow
1. User logs in with Privy (email/social)
2. First-time users select a username
3. User profile is synced with database
4. JWT tokens handle API authentication

### Feed Experience
- Smart feed algorithm that prioritizes engagement and freshness over chronological order
- Quality content surfacing with time decay and popularity bonuses
- Infinite scroll with optimistic updates
- Real-time like counts and interactions
- Responsive neumorphic card design
- Share functionality with native Web Share API

### Content Moderation
- Simple blacklist filtering for MVP
- Server-side validation on all user content
- Zod schema validation for type safety

### Search & Discovery
- Full-text search across titles and descriptions
- Category-based filtering
- Debounced search with caching
- User and topic discovery

## Deployment

The app is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

We welcome all contributors who share our mission of fostering authentic collaboration:

1. **Fork the repository** and create a feature branch
2. **Make meaningful changes** that improve the platform for creators
3. **Test thoroughly** to ensure quality and reliability
4. **Submit a pull request** with clear description of your improvements
5. **Join the discussion** - help shape the future of collaborative innovation

Whether you're fixing bugs, adding features, improving documentation, or suggesting new ideas - I am always open to review it.

## License

MIT License - see LICENSE file for details
