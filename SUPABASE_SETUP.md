# 🚀 Supabase Integration Setup Guide

This guide will help you integrate Supabase with your Scheduler App to store events in the cloud.

## Prerequisites

- ✅ Supabase account and project
- ✅ Supabase project URL and API key
- ✅ React app with Supabase client installed

## Step 1: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account

2. **Select Your Project**
   - Choose the project you want to use

3. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Copy your **Project URL**
   - Copy your **anon/public key**

## Step 2: Configure Environment Variables

1. **Create a `.env` file** in your project root:
   ```bash
   touch .env
   ```

2. **Add your Supabase credentials**:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Replace with your actual values:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 3: Set Up Database Table

1. **Go to Supabase SQL Editor**
   - In your Supabase dashboard, go to **SQL Editor**

2. **Run the Setup Script**
   - Copy the contents of `supabase-setup.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

   This will create:
   - ✅ `events` table with proper structure
   - ✅ Indexes for better performance
   - ✅ Row Level Security (RLS) policies
   - ✅ Automatic timestamp updates
   - ✅ Sample events (optional)

## Step 4: Test the Integration

1. **Start your development server**:
   ```bash
   npm start
   ```

2. **Test the application**:
   - Create a new event
   - Edit an existing event
   - Delete an event
   - Refresh the page (events should persist)

## Step 5: Deploy to Production

1. **Build your app**:
   ```bash
   npm run build
   ```

2. **Deploy to AWS**:
   ```bash
   aws s3 sync build/ s3://mikek-scheduler-app-2024 --delete --profile MikePersonal
   ```

## Database Schema

The `events` table has the following structure:

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    end TIMESTAMPTZ NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Features

- ✅ **Row Level Security (RLS)** enabled
- ✅ **Public access** for anonymous users (suitable for demo)
- ✅ **Automatic timestamps** for created_at and updated_at
- ✅ **Indexes** for optimal query performance

## API Endpoints

Your app now uses these Supabase operations:

- **GET** `/events` - Fetch all events
- **POST** `/events` - Create new event
- **PUT** `/events/:id` - Update event
- **DELETE** `/events/:id` - Delete event

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your `.env` file has correct values
   - Ensure no extra spaces or quotes

2. **"Table doesn't exist" error**
   - Run the SQL setup script in Supabase
   - Check table name is `events` (lowercase)

3. **CORS errors**
   - Supabase handles CORS automatically
   - Check your Supabase project settings

4. **Events not loading**
   - Check browser console for errors
   - Verify Supabase credentials
   - Check RLS policies

### Useful Commands

```bash
# Check environment variables
echo $REACT_APP_SUPABASE_URL

# Test Supabase connection
npm start

# View Supabase logs
# Go to Supabase Dashboard → Logs
```

## Cost Information

- **Supabase Free Tier**: 500MB database, 2GB bandwidth
- **Estimated Monthly Cost**: $0 (within free tier)
- **Upgrade**: $25/month for Pro plan if needed

## Next Steps

1. **Add Authentication** (optional)
   - Enable user accounts
   - Personal event storage
   - User-specific events

2. **Add Real-time Features**
   - Live event updates
   - Collaborative scheduling
   - Real-time notifications

3. **Add Advanced Features**
   - Event categories
   - Recurring events
   - Event attachments
   - Email notifications

Your Scheduler App now has cloud storage with Supabase! 🎉
