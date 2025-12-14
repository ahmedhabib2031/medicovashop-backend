import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Tracking number (optional)',
    example: 'TRACK123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({
    description: 'Shipping carrier (optional)',
    example: 'DHL',
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingCarrier?: string;

  @ApiProperty({
    description: 'Estimated delivery date (optional)',
    example: '2024-12-25',
    required: false,
  })
  @IsOptional()
  @IsString()
  estimatedDeliveryDate?: string;

  @ApiProperty({
    description: 'Admin notes (optional)',
    example: 'Order processed and ready for shipment',
    required: false,
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiProperty({
    description: 'Cancellation reason (required if status is cancelled)',
    example: 'Customer requested cancellation',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}






