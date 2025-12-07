# Environment Variables Setup Guide

This guide will help you set up all the required environment variables for the Medicova backend.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values (see details below)

3. **IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`

---

## Required Environment Variables

### 1. Database (MongoDB) - **REQUIRED**

```env
MONGO_URI=mongodb://localhost:27017/medicova
```

**For Production:**
```env
MONGO_URI=mongodb://username:password@your-mongodb-host:27017/medicova
```

**How to get:**
- Local: Use `mongodb://localhost:27017/medicova`
- Cloud (MongoDB Atlas): Get connection string from your cluster dashboard
- Format: `mongodb://[username:password@]host[:port][/database]`

---

### 2. JWT Secret - **REQUIRED**

```env
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
```

**How to generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any random string generator (minimum 32 characters)
```

**Security Note:** Use a strong, random string. Never use the default value in production!

---

### 3. Google OAuth 2.0 - **OPTIONAL** (for Google login)

#### Step-by-Step Setup:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "Medicova")
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "People API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External (or Internal for G Suite)
     - App name: Medicova
     - Support email: your email
     - Authorized domains: your domain (optional)
     - Save and continue through scopes
     - Add test users if needed
     - Save

5. **Create OAuth Client**
   - Application type: **Web application**
   - Name: Medicova Backend
   - Authorized redirect URIs:
     ```
     http://82.112.255.49/api/v1/auth/google/callback
     http://localhost:3000/api/v1/auth/google/callback (for local testing)
     ```
   - Click "Create"
   - **Copy the Client ID and Client Secret**

6. **Add to .env:**
   ```env
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
   GOOGLE_CALLBACK_URL=http://82.112.255.49/api/v1/auth/google/callback
   ```

---

### 4. Facebook OAuth 2.0 - **OPTIONAL** (for Facebook login)

#### Step-by-Step Setup:

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Sign in with your Facebook account

2. **Create a New App**
   - Click "My Apps" → "Create App"
   - Select "Consumer" or "Business"
   - Fill in app details:
     - App Name: Medicova
     - Contact Email: your email
   - Click "Create App"

3. **Add Facebook Login Product**
   - In your app dashboard, find "Add Product"
   - Click "Set Up" on "Facebook Login"
   - Select "Web" platform

4. **Configure Settings**
   - Go to "Settings" → "Basic"
   - Add App Domains: `82.112.255.49` (your server IP/domain)
   - Add Website: `http://82.112.255.49`
   - Save changes

5. **Configure OAuth Redirect URIs**
   - Go to "Products" → "Facebook Login" → "Settings"
   - Under "Valid OAuth Redirect URIs", add:
     ```
     http://82.112.255.49/api/v1/auth/facebook/callback
     http://localhost:3000/api/v1/auth/facebook/callback (for local testing)
     ```
   - Save changes

6. **Get App ID and Secret**
   - Go to "Settings" → "Basic"
   - **Copy App ID** and **App Secret** (click "Show" to reveal secret)

7. **Add to .env:**
   ```env
   FACEBOOK_APP_ID=1234567890123456
   FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
   FACEBOOK_CALLBACK_URL=http://82.112.255.49/api/v1/auth/facebook/callback
   ```

**Note:** For production, you may need to submit your app for review to use certain permissions.

---

### 5. AWS S3 Configuration - **OPTIONAL** (for file uploads)

#### Step-by-Step Setup:

1. **Create AWS Account**
   - Visit: https://aws.amazon.com/
   - Sign up for an account (free tier available)

2. **Create IAM User**
   - Go to IAM Console → Users → "Add users"
   - Username: `medicova-s3-user`
   - Access type: Programmatic access
   - Click "Next: Permissions"

3. **Attach S3 Policy**
   - Click "Attach existing policies directly"
   - Search and select: `AmazonS3FullAccess` (or create custom policy)
   - Click "Next" → "Create user"
   - **IMPORTANT:** Copy the Access Key ID and Secret Access Key (you won't see it again!)

4. **Create S3 Bucket**
   - Go to S3 Console → "Create bucket"
   - Bucket name: `medicova-uploads` (must be globally unique)
   - Region: Choose closest to you (e.g., `us-east-1`)
   - Uncheck "Block all public access" if you need public files
   - Click "Create bucket"

5. **Add to .env:**
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_BUCKET_NAME=medicova-uploads
   ```

---

## Complete .env File Example

```env
# Database
MONGO_URI=mongodb://localhost:27017/medicova

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://82.112.255.49/api/v1/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_CALLBACK_URL=http://82.112.255.49/api/v1/auth/facebook/callback

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=medicova-uploads
```

---

## Minimum Required Variables

For basic functionality (without OAuth and file uploads), you only need:

```env
MONGO_URI=mongodb://localhost:27017/medicova
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
```

---

## Testing Your Configuration

After setting up your `.env` file:

1. **Restart your server:**
   ```bash
   npm run start:dev
   ```

2. **Test database connection:**
   - Check server logs for MongoDB connection status

3. **Test JWT:**
   - Try registering a user: `POST /api/v1/auth/register`
   - Try logging in: `POST /api/v1/auth/login`

4. **Test Google OAuth:**
   - Visit: `http://82.112.255.49/api/v1/auth/google`
   - Should redirect to Google login

5. **Test Facebook OAuth:**
   - Visit: `http://82.112.255.49/api/v1/auth/facebook`
   - Should redirect to Facebook login

---

## Security Best Practices

1. ✅ **Never commit `.env` to git** (already in `.gitignore`)
2. ✅ **Use strong, random JWT secrets** (minimum 32 characters)
3. ✅ **Rotate secrets regularly** in production
4. ✅ **Use environment-specific values** (dev, staging, prod)
5. ✅ **Restrict OAuth redirect URIs** to your actual domains
6. ✅ **Use IAM roles** instead of access keys when possible (AWS)
7. ✅ **Enable MFA** on cloud service accounts

---

## Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB is running: `mongosh` or `mongo`
- Verify connection string format
- Check firewall/network settings

### OAuth Not Working
- Verify redirect URIs match exactly (including http/https)
- Check if OAuth apps are in "Development" mode (may need review for production)
- Ensure APIs are enabled in Google Cloud Console
- Check app permissions in Facebook Developer Console

### AWS S3 Issues
- Verify IAM user has S3 permissions
- Check bucket name is correct and exists
- Verify region matches bucket region
- Check bucket CORS configuration if needed

---

## Need Help?

- Check server logs for specific error messages
- Verify all environment variables are set: `console.log(process.env)`
- Test each service individually (database, OAuth, S3)


