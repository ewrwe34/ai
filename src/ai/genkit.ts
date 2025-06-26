import {genkit} from 'genkit';
import {config} from 'dotenv';

config(); // Load environment variables from .env file

export const ai = genkit({
  // Plugins are not configured here as we will use the OpenAI client directly.
});
