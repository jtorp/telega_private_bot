import OpenAI from 'openai';
import config from 'config';

const GPT_MODEL = 'gpt-3.5-turbo';
const ROLES = { USER: 'user', ASSISTANT: 'assistant', SYSTEM: 'system' };
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const getUserKeywords = (keywords) =>
  `Write 100 characters long greeting based on this: ${keywords}.`;

export async function generateGPT(message = '') {
  const messages = [
    {
      role: ROLES.SYSTEM,
      content: 'You are an experienced creative writer. You specialise in writing different greeting cards. Please consider ethical guidelines and avoid generating harmful or biased content. Your output should be occasion relevant and creative, written in a warm and friendly tone. You can also incorporate emoji if it suits the occasion, ensure the message is grammatically correct and up to 100 characters long.',
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
