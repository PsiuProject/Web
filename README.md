# Earth Guardians South America - Project Management Platform

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables (Already configured)
The `.env` file contains your Supabase credentials:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**Never commit these values to version control.** The `.env` file is gitignored.

### 3. Run Supabase Schema Migration

Before the app can use Supabase backend features, you need to run the SQL schema:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bnkwtlbtnvoitmjvefvw
2. Navigate to **SQL Editor** > **New Query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** to execute

This creates:
- All database tables (`projects`, `subprojects`, `project_members`, `project_content_blocks`, `canvas_positions`)
- Row Level Security (RLS) policies for data access control
- Realtime subscriptions for live collaboration
- Auto-link trigger for member invitations

### 4. (Optional) Migrate Existing Data

If you want to migrate the hardcoded project data to Supabase:

```bash
node supabase/migrate.js
```

This inserts all existing projects into the database. If skipped, the app will use fallback data automatically.

### 5. Start Development Server
```bash
pnpm run dev
```

The app will be available at `http://localhost:5173/projects/`

### 6. Build for Production
```bash
pnpm run build
```

Output goes to `dist/` folder.

### 7. Deploy to GitHub Pages
```bash
pnpm run deploy
```

---

## Features Implemented

### Authentication
- Google OAuth login (configured in Supabase Dashboard > Authentication > Providers)
- Email/password fallback (auto-signup disabled for security)
- Session persistence across page reloads
- User avatar and name display

### Projects
- Full CRUD operations via Supabase
- Drag-and-drop card repositioning (synced to database)
- Privacy settings: Public, Private, Link Only
- Shareable links with UUID-based access
- Parent-child relationships (subprojects)
- Automatic layout with collision detection

### Inline Editing
- Click any text field to edit (title, description, KPI details)
- Pencil icon appears on hover (editors only)
- Shows who else is editing a field in real-time
- Saves changes to Supabase instantly

### Content Blocks
- Add text, image, or link blocks to project detail view
- Drag-and-drop reordering
- Image URLs with captions
- Auto-formatted link chips (Instagram, YouTube, GitHub, Twitter)
- Real-time sync across collaborators

### Collaboration
- Invite members by email (viewer or editor role)
- Role-based permissions (owner, editor, viewer)
- Real-time presence indicators ("X users online")
- Live cursor/drag position sharing
- Field editing locks (see who's editing what)

### Realtime Features
- Live project updates (insert, update, delete)
- Content block synchronization
- Canvas position sharing
- Presence tracking with automatic cleanup

### Offline/Fallback Mode
- App works without Supabase (fallback to hardcoded data)
- Graceful degradation when offline
- No blank pages on connection errors

---

## Architecture

### Tech Stack
- Vue 3.5 (Composition API, `<script setup>`)
- Pinia 3 (state management)
- Supabase JS v2 (backend)
- vue-i18n 11 (internationalization)
- Vite 8 (build tool)

### Key Files
- `src/lib/supabase.js` - Supabase client initialization with null-safe guards
- `src/stores/auth.js` - Auth state and Google/email login
- `src/stores/projectsStore.js` - Projects CRUD with realtime
- `src/stores/membersStore.js` - Member/role management
- `src/stores/contentBlocksStore.js` - Content blocks for detail view
- `src/stores/realtimeStore.js` - Presence and collaboration sync
- `src/stores/gallery.js` - Gallery viewport and layout logic
- `src/components/InlineEdit.vue` - Reusable inline editing component
- `src/components/LinkChip.vue` - Auto-formatted link badges
- `src/components/ProjectCard.vue` - Draggable card with edit pencil
- `src/components/ProjectDetail.vue` - Full detail view with all features

### Security
- Row Level Security (RLS) enabled on all tables
- Owner-only project creation
- Editor permissions for collaborative editing
- Viewer read-only access
- Privacy modes: public, private, link-only

---

## Troubleshooting

### "Supabase not configured" warning
Check that `.env` file exists and contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### RLS permission errors
Ensure you ran `supabase/schema.sql` in Supabase SQL Editor. Without RLS policies, most operations will fail.

### Invited members can't see projects
The auto-link trigger should connect invited emails to user accounts on signup. If issues persist, manually update `project_members.user_id` in Supabase Table Editor.

### Blank page on load
Check browser console for errors. Common causes:
- Missing `.env` file
- Supabase outage
- Network connectivity issues

The app should fall back to offline mode, but if auth init fails catastrophically, the mount chain may break.

---

## Next Steps

1. Configure Google OAuth in Supabase Dashboard (Authentication > Providers > Google)
2. Customize project data in `src/i18n/locales/pt.json` and `en.json`
3. Adjust color theme in `src/style.css` CSS variables
4. Add more content types to content blocks as needed

---

🤖 Generated with Qoder
