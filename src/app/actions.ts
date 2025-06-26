'use server';

import { z } from 'zod';
import { generatePoemFromPhoto } from '@/ai/flows/generate-poem-from-photo';
import { customizePoemTone } from '@/ai/flows/customize-poem-tone';
import { customizePoemStyle } from '@/ai/flows/customize-poem-style';
import { translatePoem } from '@/ai/flows/translate-poem';
import fs from 'fs/promises';
import path from 'path';

const generatePoemSchema = z.object({
  photoDataUri: z.string().refine((val) => val.startsWith('data:image/'), {
    message: 'Invalid image data URI',
  }),
  tone: z.string().optional(),
  style: z.string().optional(),
  length: z.string().optional(),
});

export async function generatePoemAction(values: z.infer<typeof generatePoemSchema>) {
  try {
    const validatedValues = generatePoemSchema.parse(values);
    
    const { photoDataUri } = validatedValues;

    // Save the uploaded image
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const [header, data] = photoDataUri.split(',');
    if (!header || !data) {
      throw new Error('Invalid data URI format');
    }
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType) {
        throw new Error('Could not determine MIME type from data URI');
    }

    const extension = mimeType.split('/')[1];
    const filename = `${Date.now()}.${extension || 'png'}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(data, 'base64');
    await fs.writeFile(filePath, buffer);
    // The image is saved at public/uploads/${filename}

    const result = await generatePoemFromPhoto(validatedValues);
    return { success: true, poem: result.poem };
  } catch (error) {
    console.error('Error generating poem:', error);
    const errorMessage = error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : (error instanceof Error ? error.message : "An unknown error occurred during poem generation.");
    return { success: false, error: errorMessage };
  }
}

const customizeToneSchema = z.object({
  poem: z.string(),
  tone: z.enum(['optimistic', 'melancholic', 'humorous', 'romantic', 'reflective', 'whimsical']),
});

export async function customizeToneAction(values: z.infer<typeof customizeToneSchema>) {
  try {
    const validatedValues = customizeToneSchema.parse(values);
    const result = await customizePoemTone(validatedValues);
    return { success: true, poem: result.revisedPoem };
  } catch (error) {
    console.error('Error customizing tone:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during tone customization.";
    return { success: false, error: errorMessage };
  }
}

const customizeStyleSchema = z.object({
  poem: z.string(),
  style: z.enum(['haiku', 'limerick', 'free verse']),
});

export async function customizeStyleAction(values: z.infer<typeof customizeStyleSchema>) {
  try {
    const validatedValues = customizeStyleSchema.parse(values);
    const result = await customizePoemStyle(validatedValues);
    return { success: true, poem: result.customizedPoem };
  } catch (error) {
    console.error('Error customizing style:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during style customization.";
    return { success: false, error: errorMessage };
  }
}

const translatePoemSchema = z.object({
    poem: z.string(),
    language: z.string(),
});

export async function translatePoemAction(values: z.infer<typeof translatePoemSchema>) {
    try {
        const validatedValues = translatePoemSchema.parse(values);
        const result = await translatePoem(validatedValues);
        return { success: true, poem: result.translatedPoem };
    } catch (error) {
        console.error('Error translating poem:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during translation.";
        return { success: false, error: errorMessage };
    }
}

const imageUrlSchema = z.string().url();

export async function getImageFromUrlAction(url: string) {
    try {
        const validatedUrl = imageUrlSchema.parse(url);
        const response = await fetch(validatedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image. Status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('URL does not point to a valid image.');
        }
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return { success: true, dataUri: `data:${contentType};base64,${base64}` };
    } catch (error) {
        console.error('Error fetching image from URL:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching the image.";
        return { success: false, error: errorMessage };
    }
}