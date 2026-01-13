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

// Recipe Schemas
export const recipeIngredientSchema = z.object({
  paintId: z.string().min(1, 'Paint is required'),
  role: z.enum(['base', 'highlight', 'shadow', 'midtone', 'glaze', 'wash', 'layer'], {
    required_error: 'Paint role is required',
  }),
  ratio: z.string().max(50, 'Ratio description is too long').optional(),
  order: z.number().int().min(0),
  notes: z.string().max(200, 'Notes are too long').optional(),
});

export const recipeStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  title: z.string().min(1, 'Step title is required').max(100, 'Title is too long'),
  instruction: z.string().min(1, 'Instruction is required').max(1000, 'Instruction is too long'),
  photoUrl: z.union([z.string().url(), z.literal('')]).optional(),
  paints: z.array(z.string()).optional(),
  technique: z.string().max(50).optional(),
  tips: z.array(z.string().max(200)).optional(),
  estimatedTime: z.union([
    z.number().int().min(0),
    z.literal('')
  ]).optional(),
});

export const recipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100, 'Name is too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  category: z.enum([
    'skin-tone', 'metallic', 'fabric', 'leather', 'armor', 'weapon',
    'wood', 'stone', 'nmm', 'osl', 'weathering', 'glow-effect',
    'gem', 'base-terrain', 'other'
  ], {
    required_error: 'Please select a category',
  }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select difficulty',
  }),
  ingredients: z.array(recipeIngredientSchema).min(1, 'At least one paint ingredient is required'),
  techniques: z.array(z.enum([
    'nmm', 'osl', 'drybrushing', 'layering', 'glazing', 'washing',
    'blending', 'feathering', 'stippling', 'wetblending', 'zenithal',
    'airbrushing', 'freehand', 'weathering', 'other'
  ])).max(10, 'Maximum 10 techniques allowed').optional(),
  steps: z.array(recipeStepSchema).optional(),
  mixingInstructions: z.string().max(1000, 'Mixing instructions are too long').optional(),
  applicationTips: z.string().max(1000, 'Application tips are too long').optional(),
  resultColor: z.union([
    z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    z.literal(''),
  ]).optional(),
  estimatedTime: z.union([
    z.number().int().min(0, 'Estimated time must be positive'),
    z.literal('')
  ]).optional(),
  surfaceType: z.enum([
    'armor', 'skin', 'fabric', 'leather', 'metal', 'wood', 'stone', 'gem', 'other'
  ]).optional(),
  tags: z.array(z.string().min(1).max(20)).max(10, 'Maximum 10 tags allowed').optional(),
  isPublic: z.boolean(),
  isGlobal: z.boolean(),
  sourcePhotoUrl: z.union([z.string().url(), z.literal('')]).optional(),
});

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PileFormData = z.infer<typeof pileSchema>;
export type PhotoUploadFormData = z.infer<typeof photoUploadSchema>;
export type CustomPaintFormData = z.infer<typeof customPaintSchema>;
export type RecipeFormData = z.infer<typeof recipeSchema>;
export type RecipeIngredientFormData = z.infer<typeof recipeIngredientSchema>;
export type RecipeStepFormData = z.infer<typeof recipeStepSchema>;
