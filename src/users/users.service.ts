import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Create user (used by AuthService)
  async create(data: Partial<User>): Promise<User> {
    const user = new this.userModel(data);
    await user.save();
    return user.toObject(); // convert to plain object
  }

  // Find by email for login
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    return user ? user.toObject() : null; // convert to plain object
  }

  // Find by ID
  async findById(id: string): Promise<Partial<User>> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  // src/users/users.service.ts

  // Get all users
  async findAllUsers(): Promise<Partial<User>[]> {
    const users = await this.userModel.find({ role: UserRole.USER });
    return users.map((user) => {
      const obj = user.toObject();
      delete obj.password;
      return obj;
    });
  }

  // Get all sellers
  async findAllSellers(): Promise<Partial<User>[]> {
    const sellers = await this.userModel.find({ role: UserRole.SELLER });
    return sellers.map((seller) => {
      const obj = seller.toObject();
      delete obj.password;
      return obj;
    });
  }
  // Search users by name or email
  async searchUsers(query: string) {
    const users = await this.userModel.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    });

    return users.map((u) => {
      const obj = u.toObject();
      delete obj.password;
      return obj;
    });
  }

  // Change user role
  async changeUserRole(id: string, role: UserRole): Promise<Partial<User>> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  // Activate/deactivate user
  async changeUserStatus(id: string, active: boolean): Promise<Partial<User>> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { active },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  // Reset password
  async resetPassword(id: string, password: string): Promise<void> {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.findByIdAndUpdate(id, {
      password: hashed,
    });
    if (!user) throw new NotFoundException('User not found');
  }

  // Get all admins
  async findAllAdmins(): Promise<Partial<User>[]> {
    const admins = await this.userModel.find({ role: UserRole.ADMIN });
    return admins.map((admin) => {
      const obj = admin.toObject();
      delete obj.password;
      return obj;
    });
  }

  // Update user profile
  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!user) throw new NotFoundException('User not found');
    return user.toObject();
  }

  // Delete user
  async delete(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }
  async updateRefreshToken(userId: string, hashedToken: string) {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
    return this.userModel.findByIdAndUpdate(userId, {
      currentHashedRefreshToken: hashedToken,
      refreshTokenExpiresAt: expiresAt,
    });
  }
}
