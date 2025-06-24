'use server';

/**
 * @fileOverview Adjusts the style of the generated poem to match different forms (e.g. haiku, limerick, free verse) for varied creative expressions.
 *
 * - customizePoemStyle - A function that handles the poem style customization process.
 * - CustomizePoemStyleInput - The input type for the customizePoemStyle function.
 * - CustomizePoemStyleOutput - The return type for the customizePoemStyle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CustomizePoemStyleInputSchema = z.object({
  poem: z.string().describe('The original generated poem.'),
  style: z.enum(['haiku', 'limerick', 'free verse']).describe('The desired style of the poem.'),
});
export type CustomizePoemStyleInput = z.infer<typeof CustomizePoemStyleInputSchema>;

const CustomizePoemStyleOutputSchema = z.object({
  customizedPoem: z.string().describe('The customized poem in the desired style.'),
});
export type CustomizePoemStyleOutput = z.infer<typeof CustomizePoemStyleOutputSchema>;

export async function customizePoemStyle(input: CustomizePoemStyleInput): Promise<CustomizePoemStyleOutput> {
  return customizePoemStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizePoemStylePrompt',
  input: {schema: CustomizePoemStyleInputSchema},
  output: {schema: CustomizePoemStyleOutputSchema},
  prompt: `You are a master poet, skilled in various poetic forms.

You will take an existing poem and rewrite it in a new style, based on user request.

Original Poem: {{{poem}}}
Desired Style: {{{style}}}

Rewrite the poem in the style requested.  The customized poem should still capture the essence of the original poem.

Customized Poem:`, 
});

const customizePoemStyleFlow = ai.defineFlow(
  {
    name: 'customizePoemStyleFlow',
    inputSchema: CustomizePoemStyleInputSchema,
    outputSchema: CustomizePoemStyleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {customizedPoem: output!.customizedPoem};
  }
);
