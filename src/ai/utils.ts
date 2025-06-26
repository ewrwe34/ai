'use server';

import OpenAI from 'openai';
import type {z, ZodType} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
import type {ChatCompletionMessageParam} from 'openai/resources/chat';

const openAIClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const DEEPSEEK_MODEL = 'deepseek/deepseek-chat';

/**
 * A utility function to generate a typed AI response using a specified model.
 * It sends a prompt to the AI, instructs it to return a JSON object that
 * conforms to a given Zod schema, and then parses the response.
 *
 * @param prompt - The prompt string or message array to send to the AI.
 * @param schema - The Zod schema to which the AI's response should conform.
 * @returns A promise that resolves to the parsed, typed AI response.
 */
export async function GenerateTypedAIResponse<T extends ZodType<any, any, any>>(
  prompt: string | ChatCompletionMessageParam[],
  schema: T
): Promise<z.infer<T>> {
  const jsonSchema = zodToJsonSchema(schema, 'responseSchema');

  const messages: ChatCompletionMessageParam[] =
    typeof prompt === 'string'
      ? [
          {
            role: 'system',
            content: `You are a helpful assistant that replies in a valid JSON format matching this JSON schema: ${JSON.stringify(
              jsonSchema
            )}.`,
          },
          {role: 'user', content: prompt},
        ]
      : [
          {
            role: 'system',
            content: `You are a helpful assistant that replies in a valid JSON format matching this JSON schema: ${JSON.stringify(
              jsonSchema
            )}.`,
          },
          ...prompt,
        ];

  const response = await openAIClient.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: messages,
    response_format: {type: 'json_object'},
  });

  const output = JSON.parse(response.choices[0].message.content || '{}');
  return schema.parse(output);
}
