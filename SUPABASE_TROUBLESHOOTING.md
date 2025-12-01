# 🔧 Supabase Troubleshooting Guide

## Issue: Events not saving to Supabase database

### Step 1: Check Environment Variables

The most common issue is missing or incorrect environment variables. Let's fix this:

1. **Create a `.env` file** in your project root (same level as `package.json`):
   ```bash
   touch .env
   ```

2. **Add your Supabase credentials** to the `.env` file:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Get your credentials from Supabase**:
   - Go to [supabase.com](https://supabase.com)
   - Select your project
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon/public key**

### Step 2: Verify Database Setup

Make sure you've run the SQL setup script:

1. **Go to Supabase SQL Editor**
2. **Run this SQL** (from `supabase-setup.sql`):
   ```sql
   -- Create events table
   CREATE TABLE IF NOT EXISTS events (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       title TEXT NOT NULL,
       start TIMESTAMPTZ NOT NULL,
       "end" TIMESTAMPTZ NOT NULL,
       description TEXT,
       color TEXT DEFAULT '#3b82f6',
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;

   -- Create policy to allow all operations
   CREATE POLICY "Allow all operations on events" ON events
       FOR ALL USING (true);
   ```

### Step 3: Test the Connection

1. **Restart your development server**:
   ```bash
   npm start
   ```

2. **Open browser console** (F12)
3. **Look for debug messages**:
   - Should show "Supabase connection successful"
   - If not, check the error messages

### Step 4: Check Browser Console

Look for these messages in the browser console:

✅ **Good messages**:
```
=== Supabase Debug Info ===
Supabase URL: https://your-project.supabase.co
Supabase Key: Set
Is Configured: true
Supabase Client: Available
========================
Supabase connection successful
```

❌ **Problem messages**:
```
Supabase not configured, using localStorage
Supabase connection error: [error details]
```

### Step 5: Common Issues & Solutions

#### Issue 1: "Supabase not configured"
**Solution**: Check your `.env` file exists and has correct values

#### Issue 2: "Invalid API key"
**Solution**: Verify your anon key is correct (no extra spaces/quotes)

#### Issue 3: "Table doesn't exist"
**Solution**: Run the SQL setup script in Supabase

#### Issue 4: "Permission denied"
**Solution**: Check RLS policies in Supabase

### Step 6: Test Event Creation

1. **Create a new event** in the calendar
2. **Check Supabase dashboard**:
   - Go to **Table Editor** → **events**
   - Should see your new event

### Step 7: Deploy with Environment Variables

When deploying to Vercel, you need to set environment variables in the Vercel dashboard:

1. **Build your app**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   - Push your code to GitHub
   - Connect your repository to [Vercel](https://vercel.com)
   - Go to **Project Settings** → **Environment Variables**
   - Add the following variables:
     - `REACT_APP_SUPABASE_URL` = your Supabase project URL
     - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
   - Redeploy your application

### Quick Fix Commands

```bash
# 1. Create .env file
echo "REACT_APP_SUPABASE_URL=your_url_here" > .env
echo "REACT_APP_SUPABASE_ANON_KEY=your_key_here" >> .env

# 2. Restart development server
npm start

# 3. Check console for debug messages
```

### Still Having Issues?

1. **Check Supabase project status** - Make sure it's not paused
2. **Verify API keys** - Try creating a new anon key
3. **Check network tab** - Look for failed API requests
4. **Test with curl** - Try direct API calls

Let me know what you see in the browser console and I'll help you fix it!





