import { z } from "zod";

export const generateTopDailyGoalsSchema = z.object({
  northStar: z.string(),
  brainDump: z.string(),
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
