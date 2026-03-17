import z from "zod";
import { applicationSchema, experienceSchema } from "./helpers";

export const JobSchema = z.object({
  id: z.uuid(),
  company: z.string().nonempty(),
  title: z.string().nonempty(),
  description: z.string().optional(),
  experience: experienceSchema,
  applicationDetails: applicationSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
