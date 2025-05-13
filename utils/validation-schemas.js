import { z } from 'zod';

export const SignupValidationSchema = z.object({
  full_name: z.string().min(2),
  user_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  user_type: z.enum(['Candidate', 'Employer']),
});
export const ContactUsValidataionSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
});

export const EmployerValidationSchema = z.object({
  user: z.string().min(1, 'User reference is required').optional(),
  position: z.string().optional(),
  name: z.string().optional(),
  company_phone_number: z
    .string()
    .regex(/^[0-9]{10,15}$/, 'Invalid phone number')
    .optional(),
  company_email: z.string().email('Invalid email').optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  about_us: z.string().min(10, 'About us must be at least 10 characters').optional(),
  est_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  industry_type: z.string().optional(),
  total_working_employees: z.number().min(1, 'Must be at least 1').optional(),
  vision: z.string().optional(),
});

export const CandidateValidationSchema = z.object({
  user: z.string().min(1, 'User reference is required').optional(),
  resume_url: z.string().url('Invalid resume URL').optional(),
  position: z.string().optional(),
  previous_experience: z.string().optional(),
  total_experience: z
    .number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot be more than 50 years')
    .optional(),
  certifications: z.array(z.string()).optional(),
  current_sal: z.number().min(0, 'Current salary must be positive').optional(),
  expected_sal: z.number().min(0, 'Expected salary must be positive').optional(),
  location: z.string().optional(),
  education: z.string().optional(),
  nationality: z.string().optional(),
  bio: z.string().max(500, 'Bio should be under 500 characters').optional(),
  headline: z.string().optional(),
});

export const JobValidationSchema = z
  .object({
    job_title: z.string().min(10, 'At least 10 character required').max(30, 'Atmost 30 characters are accepted'),
    job_description: z
      .string()
      .min(100, 'At least 100 character required')
      .max(1000, 'Atmost 1000 characters are accepted'),
    location: z.string().min(1, 'Location is required'),
    category: z.string().min(1, 'job category is required'),
    salary_min: z
      .number({
        required_error: 'min salary is required',
        invalid_type_error: 'Salary minimum must be a number',
      })
      .min(0, { message: 'Salary minimum must be a positive number or zero' }),

    salary_max: z
      .number({
        required_error: 'max salary is required',
        invalid_type_error: 'Salary maximum must be a number',
      })
      .min(0, { message: 'Salary maximum must be a positive number or zero' }),

    jobType: z.enum(['full-time', 'part-time', 'contract', 'remote', 'hybrid']).default('full-time'),

    skills_required: z.array(z.string()).min(1, 'At least one skill is required'),

    experience_level: z.enum(['fresher', 'mid-level', 'senior-level']).default('fresher'),

    status: z.enum(['Active', 'Expired']),

    education: z.string(),

    applicants: z.array(z.string()).optional(),

    is_remote: z.boolean().optional().default(false),

    is_active: z.boolean().optional().default(true),
  })
  .refine(data => data.salary_min <= data.salary_max, {
    message: 'minimum salary cannot be greater than maximum salary',
    path: ['salary_min'],
  });

export const ApplicationSchema = z.object({
  resume_url: z
    .string({
      required_error: 'Resume URL is required',
    })
    .url('Resume URL must be a valid URL'),

  cover_letter: z
    .string({
      required_error: 'Cover letter is required',
    })
    .min(100, 'Cover letter must be at least 100 characters long')
    .max(1000, 'Cover letter must be at most 1000 characters long'),
});
