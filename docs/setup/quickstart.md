# Quick Start Guide

Get LingoDash up and running in under 5 minutes.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A web browser

## 1. Clone and Install

```bash
git clone https://github.com/ahmedahmedovv/lingodash.git
cd lingodash
npm install
```

## 2. Set Up Supabase Database

### Option A: Use the Existing Project (Recommended)

1. Go to the [Supabase Dashboard](https://yjlsfkhtulxmpdpihgpz.supabase.co)
2. Open SQL Editor
3. Run the SQL code from `SUPABASE_SCHEMA.sql`:

```sql
-- Copy and paste the entire contents of SUPABASE_SCHEMA.sql
-- Then click "Run" to create the words table
```

### Option B: Create Your Own Supabase Project

See [Database Setup](database.md) for detailed instructions.

## 3. Configure API Keys

1. Get a [Mistral AI API key](https://mistral.ai/)
2. Open `src/js/config.js`
3. Replace the placeholder with your actual API key:

```javascript
export const MISTRAL_API_KEY = 'your-actual-api-key-here';
```

## 4. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 5. Test the App

1. **Look up a word**: Type "hello" and press Enter
2. **Save a word**: Click the save button after lookup
3. **View saved words**: Switch to "📚 Saved Words" tab
4. **Practice**: Go to "💪 Exercise" tab (needs at least 3 saved words)

## Troubleshooting

### Database Issues
- Make sure you've run the SQL schema in Supabase
- Check that the `words` table was created successfully
- Verify your Supabase project URL is correct

### API Issues
- Ensure your Mistral API key is valid and has credits
- Check the browser console for error messages
- Rate limiting may apply (1 request per second)

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`
- Update npm: `npm update -g npm`

## Next Steps

- Read the [Learning System Guide](../user-guide/learning-system.md) to understand how spaced repetition works
- Explore [User Flows](../user-guide/user-flows.md) for detailed feature documentation
- Check out the [Architecture Overview](../development/architecture.md) for technical details

---

🎉 **You're all set!** Start building your vocabulary with LingoDash.
