import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Get my profile
  @Get('me')
  async getMe(@Req() req) {
    const profile = await this.usersService.findById(req.user.id);
    return {
      data: profile,
      message: 'Profile fetched successfully',
    };
  }
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      data: user,
      message: 'User fetched successfully',
    };
  }
    @Get('search/:query')
  @Roles(UserRole.ADMIN)
  async searchUsers(@Param('query') query: string) {
    const users = await this.usersService.searchUsers(query);
    return {
      data: users,
      message: `Search results for "${query}"`,
    };
  }

      @Put('role/:id')
    @Roles(UserRole.ADMIN)
    async changeUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
      const user = await this.usersService.changeUserRole(id, role);
      return {
        data: user,
        message: 'User role updated successfully',
      };
    }
    @Put('status/:id')
    @Roles(UserRole.ADMIN)
    async changeUserStatus(@Param('id') id: string, @Body('active') active: boolean) {
      const user = await this.usersService.changeUserStatus(id, active);
      return {
        data: user,
        message: `User has been ${active ? 'activated' : 'deactivated'}`,
      };
    }
    @Put('reset-password/:id')
    async resetPassword(@Param('id') id: string, @Body('password') password: string) {
      const result = await this.usersService.resetPassword(id, password);
      return {
        message: 'Password updated successfully',
      };
    }

  // Update my profile
  @Put('me')
  async updateMe(@Req() req, @Body() body) {
    const updated = await this.usersService.update(req.user.id, body);
    return {
      data: updated,
      message: 'Profile updated successfully',
    };
  }

  // Get all users (admin only)
  @Get('all-users')
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    const users = await this.usersService.findAllUsers();
    return {
      data: users,
      message: 'All users fetched successfully',
    };
  }

  // Get all sellers (admin only)
  @Get('all-sellers')
  @Roles(UserRole.ADMIN)
  async getAllSellers() {
    const sellers = await this.usersService.findAllSellers();
    return {
      data: sellers,
      message: 'All sellers fetched successfully',
    };
  }

  // Get all admins (admin only)
  @Get('all-admins')
  @Roles(UserRole.ADMIN)
  async getAllAdmins() {
    const admins = await this.usersService.findAllAdmins();
    return {
      data: admins,
      message: 'All admins fetched successfully',
    };
  }

  // Delete user (admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return {
      message: 'User deleted successfully',
    };
  }
}
