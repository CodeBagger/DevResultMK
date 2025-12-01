# 🔐 Google Authentication Setup Guide

This guide will help you set up Google OAuth authentication for your Scheduler App using Supabase.

## Prerequisites

- ✅ Supabase project created
- ✅ Google Cloud Console account
- ✅ Your app deployed to Vercel (or running locally)

## Step 1: Set Up Google OAuth in Google Cloud Console

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
   - Sign in with your Google account

2. **Create a New Project** (or select an existing one)
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Scheduler App")
   - Click "Create"

3. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click on it and click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - Choose **External** (unless you have a Google Workspace)
     - Fill in the required fields:
       - App name: "Scheduler App"
       - User support email: Your email
       - Developer contact: Your email
     - Click **Save and Continue**
     - Add scopes (optional, Supabase handles this)
     - Click **Save and Continue**
     - Add test users if needed (for development)
     - Click **Save and Continue** → **Back to Dashboard**

5. **Create OAuth Client ID**
   - Application type: **Web application**
   - Name: "Scheduler App Web Client"
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://devresult.com` (your production domain)
   - **Authorized redirect URIs**:
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - You'll get this from Supabase in the next step
     - **Important:** This is Supabase's callback URL, not your app URL

6. **Copy Your Credentials**
   - After creating, you'll see a popup with:
     - **Client ID** (copy this)
     - **Client Secret** (copy this)
   - Keep these safe, you'll need them in Supabase

## Step 2: Configure Google OAuth in Supabase

1. **Go to Your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list
   - Click to expand it

3. **Enable Google Provider**
   - Toggle **Enable Google provider** to ON

4. **Add Your Google Credentials**
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret

5. **Get Your Redirect URL**
   - Supabase will show you a redirect URL like:
     - `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy this URL

6. **Add Redirect URL to Google Cloud Console**
   - Go back to Google Cloud Console
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Add the Supabase redirect URL to **Authorized redirect URIs**
   - Click **Save**

7. **Save in Supabase**
   - Click **Save** in the Supabase dashboard

## Step 3: Update Database Schema

Run the authentication migration script to add user support to your events table:

1. **Go to Supabase SQL Editor**
   - In your Supabase dashboard, go to **SQL Editor**

2. **Run the Migration Script**
   - Open the file `supabase-setup-with-auth.sql`
   - Copy its contents
   - Paste into the SQL Editor
   - Click **Run**

   This will:
   - ✅ Add `user_id` column to events table
   - ✅ Create index on `user_id` for performance
   - ✅ Update RLS policies to filter events by user
   - ✅ Ensure users can only see/modify their own events

## Step 4: Test the Authentication

1. **Start your development server** (if testing locally):
   ```bash
   npm start
   ```

2. **Test the Login Flow**:
   - Open your app in the browser
   - You should see a login screen with "Continue with Google" button
   - Click the button
   - You'll be redirected to Google to sign in
   - After signing in, you'll be redirected back to your app
   - You should now see your calendar with a user menu in the header

3. **Test Event Creation**:
   - Create a new event
   - It should be saved and associated with your user account
   - Sign out and sign in with a different Google account
   - You should see different events (user-specific)

## Step 5: Deploy to Production

If you haven't already deployed to Vercel:

1. **Add Environment Variables in Vercel**:
   - Go to your Vercel project settings
   - Navigate to **Environment Variables**
   - Add these variables:
     - `REACT_APP_SUPABASE_URL` - Your Supabase project URL
     - `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anon key
     - `REACT_APP_REDIRECT_URL` - Set to `https://devresult.com` (your production domain)
       - **Important:** This ensures OAuth redirects go to your production domain, not localhost

2. **Update Google OAuth Configuration**:
   - Go back to Google Cloud Console
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - In **Authorized JavaScript origins**, ensure you have:
     - `https://devresult.com` (your production domain)
     - `http://localhost:3000` (for local development, optional)
   - The Supabase redirect URI (`https://your-project-id.supabase.co/auth/v1/callback`) should already be in **Authorized redirect URIs**
   - Click **Save**

3. **Redeploy**:
   - Push your code to GitHub
   - Vercel will automatically redeploy
   - After deployment, test the Google login to ensure it redirects to `devresult.com`

## Troubleshooting

### Issue: "Redirect URI mismatch" error

**Solution**: 
- Make sure the Supabase redirect URI is added to Google Cloud Console
- The redirect URI should be: `https://your-project-id.supabase.co/auth/v1/callback`
- Check for typos in the URL
- Verify `https://devresult.com` is in **Authorized JavaScript origins** in Google Cloud Console

### Issue: Redirects to localhost instead of devresult.com

**Solution**:
- Make sure `REACT_APP_REDIRECT_URL=https://devresult.com` is set in Vercel environment variables
- Verify the environment variable is set for **Production** environment in Vercel
- Redeploy your application after adding the environment variable
- Check that `https://devresult.com` is in Google Cloud Console's **Authorized JavaScript origins**

### Issue: "Invalid client" error

**Solution**:
- Verify your Client ID and Client Secret in Supabase match Google Cloud Console
- Make sure there are no extra spaces or characters
- Try regenerating the credentials in Google Cloud Console

### Issue: Login button doesn't redirect

**Solution**:
- Check browser console for errors
- Verify Supabase environment variables are set correctly
- Make sure Google provider is enabled in Supabase dashboard

### Issue: Events not showing after login

**Solution**:
- Make sure you ran the `supabase-setup-with-auth.sql` migration
- Check that RLS policies are correctly set up
- Verify the `user_id` column exists in the events table

## Security Notes

- ✅ **Row Level Security (RLS)** is enabled - users can only access their own events
- ✅ **OAuth tokens** are handled securely by Supabase
- ✅ **Client secrets** should never be exposed in frontend code
- ✅ **Environment variables** are securely stored in Vercel

## Next Steps

- ✅ Users can now sign in with Google
- ✅ Events are automatically associated with user accounts
- ✅ Each user sees only their own events
- ✅ You can add more OAuth providers (GitHub, Apple, etc.) in the same way

Your Scheduler App now has secure Google authentication! 🎉



