import { z } from "zod";

export const generateTopDailyGoalsSchema = z.object({
  northStar: z.string(),
  brainDump: z.string(),
  profile: z.string().optional(),
  hobbies: z.string().optional(),
});

export type GenerateTopDailyGoalsParams = z.infer<
  typeof generateTopDailyGoalsSchema
>;

export const generateScheduleSchema = z.object({
  northStar: z.string(),
  dayDuration: z.object({
    start: z.string(),
    end: z.string(),
  }),
  brainDump: z.string(),
  topGoals: z.array(z.string()),
  workingDuration: z.number().int().min(15).max(120).optional(),
  profile: z.string().optional(),
  hobbies: z.string().optional(),
  intermittentFasting: z.boolean().optional(),
});

export type GenerateScheduleParams = z.infer<typeof generateScheduleSchema>;

export const scheduleItemSchema = z.object({
  id: z.string(),
  startTime: z.number().int(),
  duration: z.number().int(),
  activity: z.string(),
  activityType: z.enum(["top-goal", "leisure", "physical", "default"]),
});

export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
