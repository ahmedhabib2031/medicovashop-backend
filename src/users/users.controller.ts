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
import { I18nService } from 'nestjs-i18n';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any): string {
    return (
      req.headers['accept-language']?.split(',')[0] ||
      req.user?.language ||
      'en'
    );
  }

  @Get('me')
  async getMe(@Req() req) {
    const profile = await this.usersService.findById(req.user.id);
    const lang = this.getLang(req);
    return {
      data: profile,
      message: await this.i18n.t('users.PROFILE_FETCHED', { lang }),
    };
  }

  @Get('search/:query')
  @Roles(UserRole.ADMIN)
  async searchUsers(@Param('query') query: string, @Req() req) {
    const users = await this.usersService.searchUsers(query);
    const lang = this.getLang(req);
    return {
      data: users,
      message: await this.i18n.t('users.SEARCH_RESULTS', {
        lang,
        args: { query },
      }),
    };
  }

  @Put('role/:id')
  @Roles(UserRole.ADMIN)
  async changeUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Req() req,
  ) {
    const user = await this.usersService.changeUserRole(id, role);
    const lang = this.getLang(req);
    return {
      data: user,
      message: await this.i18n.t('users.USER_ROLE_UPDATED', { lang }),
    };
  }

  @Put('status/:id')
  @Roles(UserRole.ADMIN)
  async changeUserStatus(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @Req() req,
  ) {
    const user = await this.usersService.changeUserStatus(id, active);
    const lang = this.getLang(req);
    return {
      data: user,
      message: await this.i18n.t(
        active ? 'users.USER_ACTIVATED' : 'users.USER_DEACTIVATED',
        { lang },
      ),
    };
  }

  @Put('reset-password/:id')
  @Roles(UserRole.ADMIN)
  async resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
    @Req() req,
  ) {
    await this.usersService.resetPassword(id, password);
    const lang = this.getLang(req);
    return {
      message: await this.i18n.t('users.PASSWORD_UPDATED', { lang }),
    };
  }

  @Put('me')
  async updateMe(@Req() req, @Body() body) {
    const updated = await this.usersService.update(req.user.id, body);
    const lang = this.getLang(req);
    return {
      data: updated,
      message: await this.i18n.t('users.PROFILE_UPDATED', { lang }),
    };
  }

  @Get('all-users')
  @Roles(UserRole.ADMIN)
  async getAllUsers(@Req() req) {
    const users = await this.usersService.findAllUsers();
    const lang = this.getLang(req);
    return {
      data: users,
      message: await this.i18n.t('users.ALL_USERS_FETCHED', { lang }),
    };
  }

  @Get('all-sellers')
  @Roles(UserRole.ADMIN)
  async getAllSellers(@Req() req) {
    const sellers = await this.usersService.findAllSellers();
    const lang = this.getLang(req);
    return {
      data: sellers,
      message: await this.i18n.t('users.ALL_SELLERS_FETCHED', { lang }),
    };
  }

  @Get('all-admins')
  @Roles(UserRole.ADMIN)
  async getAllAdmins(@Req() req) {
    const admins = await this.usersService.findAllAdmins();
    const lang = this.getLang(req);
    return {
      data: admins,
      message: await this.i18n.t('users.ALL_ADMINS_FETCHED', { lang }),
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string, @Req() req) {
    const user = await this.usersService.findById(id);
    const lang = this.getLang(req);
    return {
      data: user,
      message: await this.i18n.t('users.USER_FETCHED', { lang }),
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    await this.usersService.delete(id);
    const lang = this.getLang(req);
    return {
      message: await this.i18n.t('users.USER_DELETED', { lang }),
    };
  }
}
