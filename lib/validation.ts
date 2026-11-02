import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DONOR', 'RECIPIENT', 'VOLUNTEER']),
  organization_name: z.string().optional(),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  donor_type: z.enum(['RESTAURANT', 'HOTEL', 'CAFETERIA', 'SUPERMARKET', 'EVENT_ORGANIZER', 'INDIVIDUAL', 'OTHER']).optional(),
  capacity: z.number().positive().optional(),
  vehicle_type: z.enum(['BICYCLE', 'MOTORCYCLE', 'CAR', 'VAN', 'REFRIGERATED_VAN', 'WALKING']).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateDonationSchema = z.object({
  food_type: z.string().min(2, 'Food type is required'),
  description: z.string().min(5, 'Detailed description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('kg'),
  prepared_time: z.string().min(1, 'Prepared time is required'),
  expiry_time: z.string().min(1, 'Expiry time is required'),
});

export const CreateRequestSchema = z.object({
  food_type: z.string().min(2, 'Food type is required'),
  description: z.string().min(5, 'Detailed description is required'),
  quantity_required: z.number().positive('Required quantity must be positive'),
  unit: z.string().default('kg'),
  required_by: z.string().min(1, 'Required by timestamp is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const CreateAllocationSchema = z.object({
  donation_id: z.number().int().positive(),
  request_id: z.number().int().positive(),
  allocated_quantity: z.number().positive(),
});

export const AssignPickupSchema = z.object({
  donation_id: z.number().int().positive(),
  volunteer_id: z.number().int().positive(),
  scheduled_time: z.string().min(1),
});

export const UpdateDeliverySchema = z.object({
  delivery_status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED']),
  delivered_quantity: z.number().nonnegative(),
  recipient_signature: z.string().optional(),
});

export const FeedbackSchema = z.object({
  delivery_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comments: z.string().optional(),
});
