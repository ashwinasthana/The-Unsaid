# The Unsaid

<p align="center">
  <img src="hhttps://cdn.discordapp.com/attachments/838638355528024064/1414672839247663297/og-image.png?ex=68c06c40&is=68bf1ac0&hm=9e1723d3e85ec4c22893e6ad86321e7a6d5fc8c7f2ca980da97909d5986d365e" alt="The Unsaid logo" width="480" />
</p>

<p align="center">
  <a href="https://github.com/ashwinasthana/Unsaid"><img alt="GitHub stars" src="https://img.shields.io/github/stars/ashwinasthana/Unsaid?style=flat-square" /></a>
  <a href="https://github.com/ashwinasthana/Unsaid"><img alt="GitHub forks" src="https://img.shields.io/github/forks/ashwinasthana/Unsaid?style=flat-square" /></a>
  <a href="https://github.com/ashwinasthana/Unsaid/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/ashwinasthana/Unsaid?style=flat-square" /></a>
  <a href="https://github.com/ashwinasthana/Unsaid/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
  <a href="https://the-unsaid.vercel.app"><img alt="Live demo" src="https://img.shields.io/badge/demo-live-brightgreen?style=flat-square" /></a>
  <a href="https://vercel.com/"><img alt="Deploy on Vercel" src="https://img.shields.io/badge/deploy-vercel-black?style=flat-square" /></a>
</p>

> A collection of unsaid text messages to first loves, family members, friends, and others. The loudest words are the ones we never speak.

[Visit](https://the-unsaid.vercel.app)

---

## Table of Contents
- [About](#about)
- [Demo](#demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Installation](#installation)
- [Environment](#environment)
- [Usage](#usage)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Tech Stack](#tech-stack)
- [License](#license)
- [Support](#support)
- [Credits & Acknowledgements](#credits--acknowledgements)

---

## About
The Unsaid is a platform where people can anonymously share messages they never sent to loved ones, friends, family members, or anyone significant in their lives. It's a space for emotional expression, healing, and connection through shared human experiences of unspoken words.

Users can search for messages by recipient names and submit their own unsaid messages anonymously. Each message becomes part of a collective story of human emotion and connection.

---

## Demo
Visit the live application:

**Main Platform:** [https://the-unsaid.vercel.app](https://the-unsaid.vercel.app)

**Admin Panel:** [https://the-unsaid.vercel.app/admin](https://the-unsaid.vercel.app/admin)

Try searching for common names like "Sarah", "John", or "Mom" to see existing messages.

---

## Screenshots

Landing page with search  
<p align="center">
  <img src="https://your-screenshot-url-here.com/landing.png" alt="Landing page" width="720" />
</p>

Message collection view  
<p align="center">
  <img src="https://your-screenshot-url-here.com/messages.png" alt="Messages view" width="720" />
</p>

Submit message form  
<p align="center">
  <img src="https://your-screenshot-url-here.com/submit.png" alt="Submit form" width="720" />
</p>

Admin panel  
<p align="center">
  <img src="https://your-screenshot-url-here.com/admin.png" alt="Admin panel" width="720" />
</p>

---

## Features
- **Anonymous Message Sharing** - Submit unsaid messages without revealing identity
- **Name-based Search** - Find messages written to people with specific names
- **Elegant UI/UX** - Beautiful, minimalistic design with smooth animations
- **Responsive Design** - Works perfectly on all devices and screen sizes
- **Secure Admin Panel** - JWT-based authentication with rate limiting and IP validation
- **Message Management** - Admin can view and delete inappropriate content
- **Real-time Updates** - New messages appear immediately after submission
- **Input Validation** - Comprehensive sanitization and validation for security
- **Rate Limiting** - Prevents spam and abuse with intelligent rate limiting
- **Professional Typography** - Clean, readable Open Sans font throughout

---

## Installation
1. Clone the repository
```bash
git clone https://github.com/ashwinasthana/Unsaid.git
cd Unsaid
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up Supabase database
   - Create a new Supabase project
   - Create a `messages` table with columns:
     - `id` (uuid, primary key)
     - `recipient_name` (text)
     - `message_text` (text)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)
   - Disable Row Level Security (RLS) for admin operations

4. Configure environment variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=your_secure_admin_password
JWT_SECRET=your_jwt_secret_key
```

5. Run the development server
```bash
npm run dev
# or
yarn dev
```

Open `http://localhost:3000` to view the application.

---

## Environment
- Node.js >= 18
- npm >= 9 or yarn >= 1.22
- Supabase account and project
- Vercel account for deployment (optional)

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ADMIN_PASSWORD` - Secure password for admin access
- `JWT_SECRET` - Secret key for JWT token generation

---

## Usage
**For Users:**
1. Visit the homepage and search for a name to read existing messages
2. Click "Submit your unsaid" to share your own anonymous message
3. Fill in the recipient name and your unsaid message
4. Submit anonymously - your message will be added to the collection

**For Admins:**
1. Visit `/admin` to access the admin panel
2. Login with the admin password
3. View all submitted messages with timestamps
4. Delete inappropriate or spam messages as needed
5. Monitor platform usage and content quality

---

## Contributing
Contributions are welcome! Please follow these steps:

1. Fork the repository
```bash
git checkout -b feat/your-feature
```

2. Make your changes with clear, focused commits
3. Ensure code follows the existing style and patterns
4. Test your changes thoroughly
5. Push and create a Pull Request with detailed description

**Areas for contribution:**
- UI/UX improvements
- Additional security features
- Performance optimizations
- Accessibility enhancements
- Mobile experience improvements

---

## Roadmap
Planned enhancements:
- **Content Moderation** - AI-powered content filtering
- **Categories** - Organize messages by relationship types
- **Reactions** - Allow users to react to messages anonymously
- **Export Features** - Download messages as images or PDFs
- **Multi-language Support** - Internationalization for global reach
- **Advanced Search** - Filter by date, length, or sentiment
- **Mobile App** - Native iOS and Android applications

---

## Tech Stack
- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, Custom animations
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT tokens with HTTP-only cookies
- **Security:** Rate limiting, input sanitization, CSRF protection
- **Deployment:** Vercel
- **Typography:** Open Sans (Google Fonts)
- **Icons:** Custom emoji and Unicode symbols

---

## License
This project is licensed under the MIT License - see the `LICENSE` file for details.

---

## Support
Found a bug or have a feature request? Please open an issue:  
https://github.com/ashwinasthana/Unsaid/issues

**When reporting issues, include:**
- Browser and version
- Device type (mobile/desktop)
- Steps to reproduce
- Screenshots if applicable
- Console error messages

**For sensitive security issues:**
Please email directly instead of opening a public issue.

---

## Credits & Acknowledgements
- **Creator:** Ashwin Asthana
- **Design Inspiration:** Minimalist emotional expression platforms
- **Typography:** Google Fonts (Open Sans)
- **Database:** Supabase team for excellent PostgreSQL hosting
- **Deployment:** Vercel for seamless hosting and CI/CD
- **Community:** All users who share their unsaid messages

---

*"The loudest words are the ones we never speak."*

Thank you for being part of The Unsaid community. Every message shared helps others feel less alone in their unspoken thoughts. 💭
