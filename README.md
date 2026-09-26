# Pharm24

Pharm24 is a simple web app for tracking a home medicine cabinet. It shows
which medications you **have in stock** and which ones you **need to buy**,
along with quantity, category, and expiry date.

🔗 **Live app:** _add link after deploying to Netlify_
🎥 **Demo video (YouTube, unlisted):** _add link_

## Features

- User registration and login (email + password)
- Logout
- Add a medication (name, category, quantity, unit, expiry date)
- Automatic sorting into two columns: "In stock" and "Need to buy"
- One-click toggle between "in stock" / "ran out"
- Delete a record
- Each user's data is isolated (Row Level Security in Supabase) — one user
  can never see another user's medicine cabinet

## Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript (no framework, no build step)
- **Backend / database / auth:** [Supabase](https://supabase.com) (PostgreSQL + Supabase Auth)
- **Deployment:** Netlify

## Project structure

```
pharm24/
├── index.html            # Main page (login form + app)
├── css/
│   └── style.css         # Styles
├── js/
│   └── app.js             # Supabase connection, auth, CRUD logic
├── supabase_schema.sql    # SQL schema for the medications table + RLS policies
└── README.md
```

## Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of `supabase_schema.sql` —
   this creates the `medications` table and the row-level-security policies
   so each user only sees their own records.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
4. Paste them into `js/app.js`:

```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

5. (Optional) Under **Authentication → Providers → Email** you can disable
   email confirmation so you can log in right after signing up — useful for
   demos.

## Running locally

The app is fully static — no server required. Just open `index.html` in a
browser, or run a local server, e.g.:

```bash
npx serve .
```

## Deploying to Netlify

1. Sign up at [netlify.com](https://netlify.com).
2. "Add new site" → "Deploy manually" → drag and drop the `pharm24` folder
   (or connect your GitHub repo and select it).
3. Make sure `js/app.js` already has your real `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` **before** deploying.
4. Grab the resulting link (e.g. `https://your-site.netlify.app`) and add it
   to the top of this README.

## Author

Individual project for the Engineering Design 2 course.
