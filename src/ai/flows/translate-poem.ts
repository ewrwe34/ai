'use server';

/**
 * @fileOverview Translates a poem to a specified language.
 *
 * - translatePoem - A function that handles the poem translation process.
 * - TranslatePoemInput - The input type for the translatePoem function.
 * - TranslatePoemOutput - The return type for the translatePoem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import OpenAI from 'openai';
import {GenerateTypedAIResponse} from '@/ai/utils';


const TranslatePoemInputSchema = z.object({
  poem: z.string().describe('The poem to be translated.'),
  language: z.string().describe('The target language for translation (e.g., "Arabic").'),
});
export type TranslatePoemInput = z.infer<typeof TranslatePoemInputSchema>;

const TranslatePoemOutputSchema = z.object({
  translatedPoem: z.string().describe('The translated poem.'),
});
export type TranslatePoemOutput = z.infer<typeof TranslatePoemOutputSchema>;

export async function translatePoem(input: TranslatePoemInput): Promise<TranslatePoemOutput> {
  return translatePoemFlow(input);
}

const translatePoemFlow = ai.defineFlow(
  {
    name: 'translatePoemFlow',
    inputSchema: TranslatePoemInputSchema,
    outputSchema: TranslatePoemOutputSchema,
  },
  async input => {
    const prompt = `You are a literary translator. Translate the following poem into ${input.language}. Preserve the meaning and artistic style of the original.

Poem:
${input.poem}`;

    return await GenerateTypedAIResponse(prompt, TranslatePoemOutputSchema);
  }
);
