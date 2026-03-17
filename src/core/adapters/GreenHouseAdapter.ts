import z from "zod";
import { BaseAdapter } from "./BaseAdapter";
import { JobSchema } from "@core/schemas/Job/JobSchema";
import { GreenHouseSchema } from "../schemas/ThirdParty/GreenHouseSchema";

type Job = z.infer<typeof JobSchema>;
type GreenHouse = z.infer<typeof GreenHouseSchema>;

export class GreenHouseAdapter extends BaseAdapter<Job> {
  public validate(thirdParty: unknown): boolean {
    return GreenHouseSchema.safeParse(thirdParty).success;
  }

  public map(thirdParty: unknown): Job {
    const raw: GreenHouse = GreenHouseSchema.parse(thirdParty);

    return JobSchema.parse({
      id: crypto.randomUUID(),

      company: this.extractCompany(raw),

      title: raw.title,

      description: this.decodeHtml(raw.content),

      experience: {
        minYearsExperience: 0,
        hardSkills: [],
        softSkills: [],
      },

      applicationDetails: {
        applyUrl: raw.absolute_url,
      },

      createdAt: raw.updated_at,
      updatedAt: raw.updated_at,
    });
  }

  public toThirdParty(application: Job): unknown {
    return {
      title: application.title,
      content: application.description,
      absolute_url: application.applicationDetails.applyUrl,
    };
  }

  // ------------------------
  // Helpers
  // ------------------------

  private extractCompany(raw: GreenHouse): string {
    if (raw.departments.length > 0) {
      return raw.departments[0].name;
    }
    return "Unknown Company";
  }

  private decodeHtml(html: string): string {
    return html
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }
}
