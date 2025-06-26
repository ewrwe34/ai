'use server';

/**
 * @fileOverview Adjusts the tone of a generated poem based on user-selected options.
 *
 * - customizePoemTone - A function that adjusts the poem's tone.
 * - CustomizePoemToneInput - The input type for the customizePoemTone function.
 * - CustomizePoemToneOutput - The return type for the customizePoemTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import OpenAI from 'openai';
import {GenerateTypedAIResponse} from '@/ai/utils';


const CustomizePoemToneInputSchema = z.object({
  poem: z.string().describe('The original generated poem.'),
  tone: z
    .enum([
      'optimistic',
      'melancholic',
      'humorous',
      'romantic',
      'reflective',
      'whimsical',
    ])
    .describe("The desired tone for the poem. Options: optimistic, melancholic, humorous, romantic, reflective, whimsical."),
});
export type CustomizePoemToneInput = z.infer<typeof CustomizePoemToneInputSchema>;

const CustomizePoemToneOutputSchema = z.object({
  revisedPoem: z.string().describe('The poem revised to match the specified tone.'),
});
export type CustomizePoemToneOutput = z.infer<typeof CustomizePoemToneOutputSchema>;

export async function customizePoemTone(input: CustomizePoemToneInput): Promise<CustomizePoemToneOutput> {
  return customizePoemToneFlow(input);
}

const customizePoemToneFlow = ai.defineFlow(
  {
    name: 'customizePoemToneFlow',
    inputSchema: CustomizePoemToneInputSchema,
    outputSchema: CustomizePoemToneOutputSchema,
  },
  async input => {
    const prompt = `You are a master poet, skilled at adjusting the tone of existing poems.

  Revise the following poem to be more ${input.tone}. Maintain the original poem's theme and imagery, but adjust the word choice and phrasing to match the specified tone.

Original Poem:
${input.poem}`;

    return await GenerateTypedAIResponse(prompt, CustomizePoemToneOutputSchema);
  }
);
