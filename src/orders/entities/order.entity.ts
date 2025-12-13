import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Schema({ _id: false, timestamps: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productNameAr: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, default: null })
  size: string | null;

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: Number, required: true })
  unitPrice: number; // Price at time of order

  @Prop({ type: Number, default: 0 })
  discount: number; // Discount amount for this item

  @Prop({ type: Number, required: true })
  subtotal: number; // (unitPrice * quantity) - discount

  @Prop({ type: String, default: null })
  productImage: string | null;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string; // Auto-generated unique order number

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ type: Types.ObjectId, ref: 'CustomerAddress', required: true })
  shippingAddressId: Types.ObjectId;

  // Pricing breakdown
  @Prop({ type: Number, required: true })
  subtotal: number; // Sum of all items subtotals

  @Prop({ type: Number, default: 0 })
  discountAmount: number; // Total discount from coupon

  @Prop({ type: Types.ObjectId, ref: 'Discount', default: null })
  couponId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  couponCode: string | null;

  @Prop({ type: Number, default: 0 })
  shippingCost: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, required: true })
  total: number; // subtotal - discountAmount + shippingCost + tax

  // Payment information
  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, default: null })
  transactionId: string | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  // Order status
  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: Date, default: null })
  confirmedAt: Date | null;

  @Prop({ type: Date, default: null })
  shippedAt: Date | null;

  @Prop({ type: String, default: null })
  trackingNumber: string | null;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: String, default: null })
  cancellationReason: string | null;

  // Shipping information
  @Prop({ type: String, default: null })
  shippingCarrier: string | null;

  @Prop({ type: String, default: null })
  estimatedDeliveryDate: string | null;

  // Notes
  @Prop({ type: String, default: null })
  customerNotes: string | null;

  @Prop({ type: String, default: null })
  adminNotes: string | null;

  // Seller information (for multi-seller orders, we track which seller this order belongs to)
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  sellerId: Types.ObjectId | null; // If order contains products from single seller

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
