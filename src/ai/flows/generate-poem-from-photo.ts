'use server';
/**
 * @fileOverview AI agent that generates a poem from a photo.
 *
 * - generatePoemFromPhoto - A function that handles the poem generation process.
 * - GeneratePoemFromPhotoInput - The input type for the generatePoemFromPhoto function.
 * - GeneratePoemFromPhotoOutput - The return type for the generatePoemFromPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GeneratePoemFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to inspire the poem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  tone: z.string().optional().describe('The tone of the poem (e.g., happy, sad, reflective).'),
  style: z.string().optional().describe('The style of the poem (e.g., free verse, sonnet).'),
  length: z.string().optional().describe('The desired length of the poem (e.g., short, medium, long).'),
});
export type GeneratePoemFromPhotoInput = z.infer<typeof GeneratePoemFromPhotoInputSchema>;

const GeneratePoemFromPhotoOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemFromPhotoOutput = z.infer<typeof GeneratePoemFromPhotoOutputSchema>;

export async function generatePoemFromPhoto(input: GeneratePoemFromPhotoInput): Promise<GeneratePoemFromPhotoOutput> {
  return generatePoemFromPhotoFlow(input);
}

const generatePoemFromPhotoPrompt = ai.definePrompt({
    name: 'generatePoemFromPhotoPrompt',
    input: { schema: GeneratePoemFromPhotoInputSchema },
    output: { schema: GeneratePoemFromPhotoOutputSchema },
    prompt: `You are a poet laureate, skilled at creating poems inspired by images. Based on the image provided, write a poem that captures its essence and mood.

Tone: {{#if tone}}{{tone}}{{else}}not specified{{/if}}
Style: {{#if style}}{{style}}{{else}}not specified{{/if}}
Length: {{#if length}}{{length}}{{else}}not specified{{/if}}

Write a poem inspired by the image. Focus on imagery, emotion, and storytelling.
The poem should reflect the content and mood of the photo.
The poem should be in the requested tone, style and length.
If tone, style, and length is not specified, create a poem in your own style.

{{media url=photoDataUri}}`,
    config: {
        model: 'gemini-1.5-flash',
    }
});


const generatePoemFromPhotoFlow = ai.defineFlow(
  {
    name: 'generatePoemFromPhotoFlow',
    inputSchema: GeneratePoemFromPhotoInputSchema,
    outputSchema: GeneratePoemFromPhotoOutputSchema,
  },
  async (input) => {
    const { output } = await generatePoemFromPhotoPrompt(input);
    return output!;
  }
);
