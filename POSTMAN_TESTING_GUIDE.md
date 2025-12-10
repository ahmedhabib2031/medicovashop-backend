# Postman Testing Guide for Auth Endpoints

## Available Endpoints

### 1. Regular Authentication

#### Register
- **Method**: `POST`
- **URL**: `http://82.112.255.49/api/v1/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "language": "en"
  }
  ```

#### Login
- **Method**: `POST`
- **URL**: `http://82.112.255.49/api/v1/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Refresh Token
- **Method**: `GET`
- **URL**: `http://82.112.255.49/api/v1/auth/refresh`
- **Headers**: 
  ```
  Authorization: Bearer <refresh_token>
  x-user-id: <user_id>
  ```

---

### 2. Google OAuth (Browser Flow)

#### Initiate Google OAuth
- **Method**: `GET`
- **URL**: `http://82.112.255.49/api/v1/auth/google`
- **Note**: This will redirect to Google login page. Use in browser or Postman's OAuth 2.0 tab.

#### Google OAuth Callback
- **Method**: `GET`
- **URL**: `http://82.112.255.49/api/v1/auth/google/callback`
- **Note**: This is automatically called by Google after authentication.

---

### 3. Facebook OAuth (Browser Flow)

#### Initiate Facebook OAuth
- **Method**: `GET`
- **URL**: `http://82.112.255.49/api/v1/auth/facebook`
- **Note**: This will redirect to Facebook login page. Use in browser or Postman's OAuth 2.0 tab.

#### Facebook OAuth Callback
- **Method**: `GET`
- **URL**: `http://82.112.255.49/api/v1/auth/facebook/callback`
- **Note**: This is automatically called by Facebook after authentication.

---

### 4. Direct Token Testing (Recommended for Postman)

#### Google Token Login
- **Method**: `POST`
- **URL**: `http://82.112.255.49/api/v1/auth/google/token`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "accessToken": "ya29.a0AfH6SMB..."
  }
  ```

**How to get Google Access Token:**
1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select "Google OAuth2 API v2" → "userinfo.email" and "userinfo.profile"
3. Click "Authorize APIs"
4. After authorization, click "Exchange authorization code for tokens"
5. Copy the "Access token" value
6. Use it in the request body above

#### Facebook Token Login
- **Method**: `POST`
- **URL**: `http://82.112.255.49/api/v1/auth/facebook/token`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "accessToken": "EAABwzLixnjYBO..."
  }
  ```

**How to get Facebook Access Token:**
1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Add permissions: `email`, `public_profile`
4. Click "Generate Access Token"
5. Copy the token value
6. Use it in the request body above

---

## Testing OAuth 2.0 in Postman (Alternative Method)

### Using Postman's OAuth 2.0 Tab

1. Create a new request
2. Go to **Authorization** tab
3. Select **OAuth 2.0** as Type
4. Fill in:
   - **Grant Type**: Authorization Code
   - **Callback URL**: `http://82.112.255.49/api/v1/auth/google/callback` (or Facebook callback)
   - **Auth URL**: 
     - Google: `https://accounts.google.com/o/oauth2/v2/auth`
     - Facebook: `https://www.facebook.com/v18.0/dialog/oauth`
   - **Access Token URL**:
     - Google: `https://oauth2.googleapis.com/token`
     - Facebook: `https://graph.facebook.com/v18.0/oauth/access_token`
   - **Client ID**: Your OAuth app client ID
   - **Client Secret**: Your OAuth app secret
   - **Scope**: 
     - Google: `email profile`
     - Facebook: `email public_profile`
5. Click **Get New Access Token**
6. After authorization, use the token in subsequent requests

---

## Expected Responses

### Success Response
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "firstName": "John",
      "lastName": "Doe",
      "language": "en"
    }
  },
  "message": "User logged in successfully"
}
```

### Error Response
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

## Notes

- All endpoints use the base URL: `http://82.112.255.49/api/v1`
- For production, replace with your production domain
- Access tokens expire after 1 hour
- Refresh tokens expire after 2 weeks
- Social auth tokens (Google/Facebook) are verified against their respective APIs








