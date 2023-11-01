import OpenAI from 'openai';
import config from 'config';

const GPT_MODEL = 'gpt-3.5-turbo';
const ROLES = { USER: 'user', ASSISTANT: 'assistant', SYSTEM: 'system' };
const openai = new OpenAI({
  apiKey: config.get('APIKeys.OPENAI_TOKEN'),
});

const getUserKeywords = (keywords) =>
  `Write 100 characters long text which is based on the provided keywords: ${keywords}.`;

export async function generateGPT(message = '') {
  const messages = [
    {
      role: ROLES.SYSTEM,
      content: config.get('Prompts.CONTENT_PROMPT'),
    },
    {
      role: ROLES.USER,
      content: getUserKeywords(message),
    },
  ];
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: GPT_MODEL,
    });
    return chatCompletion.choices[0].message;
  } catch (error) {
    console.error('Error while chat completion', error);
  }
}
