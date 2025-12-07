# Swagger Documentation Setup

Swagger/OpenAPI documentation has been added to the Medicova API. 

## Installation

First, install the Swagger package:

```bash
npm install
```

This will install `@nestjs/swagger` which was added to `package.json`.

## Access Swagger UI

After starting the server, access Swagger documentation at:

- **Local**: http://localhost:3000/api/docs
- **Production**: http://82.112.255.49/api/docs

## Features

✅ **Swagger UI** - Interactive API documentation
✅ **Bearer Auth** - JWT authentication support
✅ **API Tags** - Organized by resource (Auth, Categories, Subcategories, Brands, etc.)
✅ **Request/Response Examples** - All endpoints documented
✅ **Query Parameters** - Documented for pagination and filtering
✅ **Error Responses** - Documented status codes

## Documented Controllers

The following controllers have been fully documented:

1. **Root** (`/`) - API information
2. **Auth** (`/api/v1/auth`) - Authentication endpoints
   - Register
   - Login
   - Refresh token
3. **Categories** (`/api/v1/category`) - Category management
   - Create, Read, Update, Delete
   - Status update
   - Pagination and search
4. **Subcategories** (`/api/v1/subcategory`) - Subcategory management
   - Create, Read, Update, Delete
   - Status update
   - Filter by parent category
5. **Brands** (`/api/v1/brands`) - Brand management
   - Create, Read, Update, Delete
   - Status update

## Using Swagger UI

1. **View Endpoints**: Browse all available endpoints organized by tags
2. **Test Endpoints**: Click "Try it out" on any endpoint
3. **Authenticate**: 
   - Click the "Authorize" button at the top
   - Enter your JWT token (from login response)
   - Click "Authorize"
4. **View Schemas**: See request/response models
5. **Copy cURL**: Get cURL commands for testing

## Adding More Documentation

To add Swagger docs to other controllers:

1. Import Swagger decorators:
```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
```

2. Add tags to controller:
```typescript
@ApiTags('YourTag')
@ApiBearerAuth('JWT-auth')
@Controller('your-endpoint')
```

3. Add operation docs to methods:
```typescript
@Post()
@ApiOperation({ summary: 'Your summary', description: 'Your description' })
@ApiResponse({ status: 201, description: 'Success message' })
async yourMethod() { ... }
```

4. Add property docs to DTOs:
```typescript
@ApiProperty({ example: 'example value', description: 'Field description' })
fieldName: string;
```

## Notes

- All protected endpoints require JWT authentication
- Use the "Authorize" button in Swagger UI to add your token
- The token persists across requests when using Swagger UI
- Production server URL is configured in Swagger config


