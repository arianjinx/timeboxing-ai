"use server";

import {
  type GenerateScheduleParams,
  generateScheduleSchema,
  scheduleItemSchema,
} from "@/app/dto";
import { generateTopDailyGoalsSchema } from "@/app/dto";
import type { GenerateTopDailyGoalsParams } from "@/app/dto";
import { model } from "@/lib/model";
import { rateLimit } from "@/lib/rate-limiter";
import { generateObject } from "ai";
import { headers } from "next/headers";
import { z } from "zod";

/**
 * Get a unique identifier for the current request (IP address)
 */
async function getRequestIdentifier() {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  return ip;
}

export async function generateTopDailyGoals(
  params: GenerateTopDailyGoalsParams,
) {
  // Rate limit check
  const identifier = await getRequestIdentifier();
  const rateLimitResult = await rateLimit(identifier, "generateTopDailyGoals");

  if (!rateLimitResult.success) {
    throw new Error(rateLimitResult.error);
  }

  const { success } = generateTopDailyGoalsSchema.safeParse(params);
  if (!success) {
    throw new Error("Invalid input");
  }

  // Define the schema for the response
  const topGoalsResponseSchema = z.object({
    topGoals: z.array(z.string()),
  });

  // Build additional context if available
  const profileContext = params.profile
    ? `\nUser profile: "${params.profile}"`
    : "";
  const hobbiesContext = params.hobbies
    ? `\nUser hobbies and interests: "${params.hobbies}"`
    : "";
  const additionalContext = profileContext + hobbiesContext;

  // Use generateObject to generate the top daily goals
  const result = await generateObject({
    model,
    schemaName: "topDailyGoals",
    schemaDescription: "Generate top 3 daily goals based on given context.",
    schema: topGoalsResponseSchema,
    prompt: `<task>
I need you to generate 3 focused daily goals based on the user information delimited by triple backticks:

\`\`\`
North Star: "${params.northStar}"
Brain Dump: "${params.brainDump}"${additionalContext}
\`\`\`

Follow these specific instructions in sequence:
1. First, carefully analyze the user's north star (long-term vision) and brain dump (current thoughts/tasks)
2. Identify the most important and impactful activities that align with the north star
3. Prioritize tasks that will move the user closer to their long-term vision
4. Select exactly 3 specific, actionable goals that can realistically be accomplished in a single day
5. Ensure each goal is clear, concrete, and measurable

The goals should be:
- Specific and actionable (not vague)
- Aligned with the user's north star
- Realistic to accomplish in a single day
- Focused on high-impact activities
- Written in a concise, direct format
- Plain text, no markdown
</task>`,
  });

  return {
    topGoals: result.object.topGoals,
  };
}

export async function generateSchedule(params: GenerateScheduleParams) {
  // Rate limit check
  const identifier = await getRequestIdentifier();
  const rateLimitResult = await rateLimit(identifier, "generateSchedule");

  if (!rateLimitResult.success) {
    throw new Error(rateLimitResult.error);
  }

  const { success } = generateScheduleSchema.safeParse(params);
  if (!success) {
    throw new Error("Invalid input");
  }

  // Define the schema for the response
  const scheduleResponseSchema = z.object({
    schedule: z.array(scheduleItemSchema),
  });

  // Build additional context from user profile if available
  const profileContext = params.profile
    ? `\nUser profile: "${params.profile}"`
    : "";
  const hobbiesContext = params.hobbies
    ? `\nUser hobbies and interests: "${params.hobbies}"`
    : "";
  const fastingContext = params.intermittentFasting
    ? "\nUser practices intermittent fasting, so avoid scheduling meal times too close together and consider a later breakfast/earlier dinner window. Common methods include 16:8 (16 hours fasting, 8-hour eating window)."
    : "";
  const dateContext = params.date
    ? `\nThe date of the schedule is: "${params.date}"`
    : "";

  const additionalContext =
    profileContext + hobbiesContext + fastingContext + dateContext;

  // Use generateObject to generate the schedule
  const result = await generateObject({
    model,
    schemaName: "dailySchedule",
    schemaDescription: "Generate a daily schedule based on given context.",
    schema: scheduleResponseSchema,
    prompt: `<task>
Generate a realistic daily schedule applying timeboxing principles based on the user's information delimited by triple backticks:

\`\`\`
Day Duration: "${params.dayDuration.start} to ${params.dayDuration.end}"
Core Time: "${params.coreTime.start} to ${params.coreTime.end}"
North Star: "${params.northStar}"
Brain Dump: "${params.brainDump}"
Top Goals: "${params.topGoals.join(", ")}"${additionalContext}
\`\`\`

Follow these specific instructions in sequence:
1. First, analyze the user's top goals and identify the most important activities that will help achieve these goals
2. Create dedicated 1-hour minimum time blocks for each of the top goals, with clear start and end times
3. Include 1-hour rest/break blocks between intense focus sessions (research shows regular breaks improve productivity)
4. Allocate at least one 1-hour block for physical activity/movement 
5. Include at least one 1-2 hour leisure/entertainment block
6. Consider grouping similar tasks into larger time blocks when appropriate (1+ hours each)
7. Ensure the schedule is realistic and achievable, with appropriate transitions between activities
8. Include time for meals and basic self-care activities
9. Make sure the activity type is matched to the activity, it should be one of the following: ${Object.keys(scheduleItemSchema.shape.activityType.enum).join(", ")}

The schedule should follow timeboxing principles, which means:
- Each activity has a specific start and end time
- Time is allocated in focused blocks
- The day has a balanced mix of productive work, physical activity, and leisure
- Activities are arranged to maximize energy levels throughout the day

IMPORTANT: For the startTime field in each schedule item, you MUST use a number format where:
- Whole hours are represented as integers (e.g., 9 for 9:00 AM, 14 for 2:00 PM)
- Half hours are represented with .5 (e.g., 9.5 for 9:30 AM, 14.5 for 2:30 PM)
- Only use whole numbers or .5 values - no other decimal values are allowed
- The startTime must be within the day duration specified above

For example:
- 8:00 AM should be represented as startTime: 8
- 8:30 AM should be represented as startTime: 8.5
- 2:00 PM should be represented as startTime: 14
- 2:30 PM should be represented as startTime: 14.5
</task>`,
  });

  return {
    schedule: result.object.schedule,
  };
}
