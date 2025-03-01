"use server";

import {
  type GenerateScheduleParams,
  generateScheduleSchema,
  scheduleItemSchema,
} from "@/app/dto";
import { generateTopDailyGoalsSchema } from "@/app/dto";
import type { GenerateTopDailyGoalsParams } from "@/app/dto";
import { model } from "@/lib/model";
import { generateObject } from "ai";
import { z } from "zod";

export async function generateTopDailyGoals(
  params: GenerateTopDailyGoalsParams,
) {
  const { success } = generateTopDailyGoalsSchema.safeParse(params);
  if (!success) {
    throw new Error("Invalid input");
  }

  // Define the schema for the response
  const topGoalsResponseSchema = z.object({
    topGoals: z.array(z.string()),
  });

  // Use generateObject to generate the top daily goals
  const result = await generateObject({
    model,
    schemaName: "topDailyGoals",
    schemaDescription:
      "Generate top 3 daily goals based on brain dump and north star.",
    schema: topGoalsResponseSchema,
    prompt: `Based on the user's north star: "${params.northStar}" and brain dump: "${params.brainDump}", 
    generate 3 focused daily goals.
    DO NOT return in markdown format.`,
  });

  // Return the same format as the current dummy output
  return {
    topGoals: result.object.topGoals,
  };
}

export async function generateSchedule(params: GenerateScheduleParams) {
  const { success } = generateScheduleSchema.safeParse(params);
  if (!success) {
    throw new Error("Invalid input");
  }

  // Define the schema for the response
  const scheduleResponseSchema = z.object({
    schedule: z.array(scheduleItemSchema),
  });

  // Use generateObject to generate the schedule
  const result = await generateObject({
    model,
    schemaName: "dailySchedule",
    schemaDescription:
      "Generate a daily schedule based on the top goals, brain dump, and north star.",
    schema: scheduleResponseSchema,
    prompt: `Based on the user's north star: "${params.northStar}", 
brain dump: "${params.brainDump}", 
and top goals: "${params.topGoals.join(", ")}", 
generate a realistic daily schedule applying timeboxing principles:

1. Create dedicated 1-hour minimum time blocks for each of the top goals, with clear start and end times
2. Include 1-hour rest/break blocks between intense focus sessions (research shows regular breaks improve productivity)
3. Allocate at least one 1-hour block for physical activity/movement 
4. Include at least one 1-2 hour leisure/entertainment block
5. Consider grouping similar tasks into larger time blocks when appropriate (1+ hours each)
6. Prioritize the most important/challenging tasks during peak productivity hours (typically morning)
7. ONLY schedule activities between the user's preferred hours of ${params.dayDuration.start} and ${params.dayDuration.end}

IMPORTANT: Each activity block MUST be a minimum of 1 hour in duration. Do NOT suggest any activities shorter than 1 hour.
IMPORTANT: Only create schedule items that fall within the user's preferred time window of ${params.dayDuration.start} to ${params.dayDuration.end}.
DO NOT return in markdown format.
The startTime should be a number from 0 to 23, representing hours in a 24-hour day.
Make the schedule realistic by not overloading the day with too many tasks.`,
  });

  // Return the same format as the current dummy output
  return {
    schedule: result.object.schedule,
  };
}

const categorizeActivitySchema = z.object({
  activity: z.string().min(1),
  topGoals: z.array(z.string()),
});

export type CategorizeActivityParams = z.infer<typeof categorizeActivitySchema>;

export async function categorizeActivity(params: CategorizeActivityParams) {
  const { success } = categorizeActivitySchema.safeParse(params);
  if (!success) {
    throw new Error("Invalid input");
  }

  // Define the schema for the activity categorization response
  const activityCategorySchema = z.object({
    category: z.enum(["top-goal", "leisure", "physical", "default"]),
  });

  // Use generateObject to categorize the activity
  const result = await generateObject({
    model,
    schemaName: "activityCategory",
    schemaDescription: "Categorize an activity based on its description",
    schema: activityCategorySchema,
    prompt: `Categorize the following activity: "${params.activity}"

Top goals provided by the user: ${params.topGoals.filter(Boolean).join(", ")}

Categorize this activity into one of these types:
1. "top-goal" - If it directly relates to one of the user's top goals
2. "leisure" - If it's for relaxation, entertainment, breaks, or hobbies
3. "physical" - If it involves exercise, physical activity, or movement
4. "default" - If it doesn't fit clearly into the above categories

Return only the category name as a string.`,
  });

  return {
    category: result.object.category,
  };
}
