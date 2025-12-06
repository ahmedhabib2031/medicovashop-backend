import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      data: {
        message: 'Welcome to Medicova API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          auth: {
            register: 'POST /api/v1/auth/register',
            login: 'POST /api/v1/auth/login',
            refresh: 'GET /api/v1/auth/refresh',
          },
          users: {
            profile: 'GET /api/v1/users/me',
            updateProfile: 'PUT /api/v1/users/me',
          },
          categories: {
            list: 'GET /api/v1/category',
            create: 'POST /api/v1/category',
            getOne: 'GET /api/v1/category/:id',
            update: 'PUT /api/v1/category/:id',
            delete: 'DELETE /api/v1/category/:id',
            updateStatus: 'PATCH /api/v1/category/:id/status',
          },
          subcategories: {
            list: 'GET /api/v1/subcategory',
            create: 'POST /api/v1/subcategory',
            getOne: 'GET /api/v1/subcategory/:id',
            update: 'PUT /api/v1/subcategory/:id',
            delete: 'DELETE /api/v1/subcategory/:id',
            updateStatus: 'PATCH /api/v1/subcategory/:id/status',
          },
          subcategoryChild: {
            list: 'GET /api/v1/subcategory-child',
            create: 'POST /api/v1/subcategory-child',
            getOne: 'GET /api/v1/subcategory-child/:id',
            update: 'PUT /api/v1/subcategory-child/:id',
            delete: 'DELETE /api/v1/subcategory-child/:id',
            updateStatus: 'PATCH /api/v1/subcategory-child/:id/status',
          },
          brands: {
            list: 'GET /api/v1/brands',
            create: 'POST /api/v1/brands',
            getOne: 'GET /api/v1/brands/:id',
            update: 'PUT /api/v1/brands/:id',
            delete: 'DELETE /api/v1/brands/:id',
            updateStatus: 'PATCH /api/v1/brands/:id/status',
          },
        },
        timestamp: new Date().toISOString(),
      },
      message: 'Welcome Medicova API is running',
    };
  }
}
