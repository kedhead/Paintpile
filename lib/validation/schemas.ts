import { z } from 'zod';
import { PROJECT_STATUSES } from '@/lib/utils/constants';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Project Schemas
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.enum(['not-started', 'in-progress', 'completed'], {
    required_error: 'Please select a status',
    invalid_type_error: 'Please select a status',
  }),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10000, 'Quantity is too large').optional(),
  tags: z.array(z.string().min(1).max(20)).max(10, 'Maximum 10 tags allowed').optional(),
  startDate: z.date().optional(),
});

// Profile Schemas
export const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username is too long')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(200, 'Bio is too long').optional(),
});

// Pile Schemas
export const pileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.string().min(1, 'Type is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const pileItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.enum(['warhammer', 'd&d', 'historical', 'board-game', 'other'], {
    required_error: 'Please select a type',
    invalid_type_error: 'Please select a type',
  }),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  status: z.enum(['unpainted', 'painting', 'painted'], {
    required_error: 'Please select a status',
    invalid_type_error: 'Please select a status',
  }),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Photo Upload Schema
export const photoUploadSchema = z.object({
  caption: z.string().max(200, 'Caption is too long').optional(),
});

// Paint Schemas
export const customPaintSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  name: z.string().min(1, 'Paint name is required'),
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
});

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PileFormData = z.infer<typeof pileSchema>;
export type PhotoUploadFormData = z.infer<typeof photoUploadSchema>;
export type CustomPaintFormData = z.infer<typeof customPaintSchema>;
