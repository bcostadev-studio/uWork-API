import { z } from "zod";

export const GreenHouseSchema = z.object({
  id: z.number(),
  internal_job_id: z.number(),
  title: z.string(),
  updated_at: z.date(),
  location: z.object({
    name: z.string(),
  }),
  absolute_url: z.url(),
  language: z.string(),
  content: z.string(),
  departments: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    )
    .optional()
    .default([]),
});
