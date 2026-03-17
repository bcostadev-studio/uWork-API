import { z } from "zod";

export const jobTypeEnum = z.enum([
  "full-time",
  "part-time",
  "contract",
  "temporary",
  "internship",
  "freelance",
]);

export const seniorityLevelEnum = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "manager",
  "director",
]);

export const experienceSchema = z.object({
  minYearsExperience: z.number().int().min(0).max(50),

  jobType: jobTypeEnum,

  seniorityLevel: seniorityLevelEnum.optional(),

  hardSkills: z
    .array(z.string().min(1))
    .min(1, "At least one hard skill is required"),

  softSkills: z.array(z.string().min(1)).default([]),

  preferredSkills: z.array(z.string().min(1)).optional(),

  certifications: z.array(z.string().min(1)).optional(),

  industries: z.array(z.string()).optional(),

  leadershipExperience: z.boolean().optional(),

  remoteExperience: z.boolean().optional(),
});

export const applicationSchema = z.object({
  applyUrl: z.url(),
  email: z.email().optional(),
  deadline: z.date().optional(),
});
