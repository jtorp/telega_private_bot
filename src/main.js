import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { generateGPT } from './openai.js';
import config from 'config';

const activeChats = new Set();

const bot = new Telegraf(config.get('APIKeys.TELEGRAM_TOKEN'), {
  handlerTimeout: Infinity,
});



bot.start((ctx) => {
  activeChats.add(ctx.chat.id);
  console.log(`Active chat: ${ctx.chat.id}`);

  const welcomeMessage =
    '👋 Hey!\n\n' +
    "I'm here to assist you in writing greeting messages for any occasion. Please tell me who is it for, and what is the occasion for the greeting.\n";
  ctx.reply(welcomeMessage);
});
bot.help((ctx) => {
  sendCommandList(ctx);
});

 bot.on(message('text'), processAIResponse);

function sendCommandList(ctx) {
  const commandList = [
    '/start - Press start and then provide me with some keywords. Who do you want to send the greeting to, and what is the occasion for the greeting',
    '/help - Get help and instructions',
  ];

  const commandListMessage =
    '🆘 Available commands:\n' + commandList.join('\n');
  ctx.reply(commandListMessage);
}

bot.action('send_to_notion', async (ctx) => {
  const loginUrl = 'https://www.notion.so/login';
  ctx.replyWithHTML(
    'Login to your notion',
    Markup.inlineKeyboard([
      Markup.button.callback('login to notion', loginUrl),
    ]),
  );
});

// Store the original user keywords and also to store the button click count in bot memory to prevent spam
const originalUserInput = {};
const buttonClickCount = {};

async function processAIResponse(ctx) {
  try {
    const text = ctx.message.text;
    const minInputLength = 3;
    const trimmedText = text.trim();

    originalUserInput[ctx.from.id] = trimmedText;

    if (trimmedText.length < minInputLength) {
      ctx.reply('Please provide a meaningful input with at least one keyword.');
      return;
    }

    const response = await generateGPT(trimmedText);

    if (!response) {
      ctx.reply(
        "Sorry, I couldn't generate content for you. You ran out of the free API credits. Please try again later.",
      );
    } else {
      const formattedResponse = `<b style="color:green;">Voila 🪄 Your greeting is ready!</b>\n\n${response.content}`;
      ctx.replyWithHTML(
        formattedResponse,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "👎 I don't like it. Give me another one!",
            'generate_new',
          ),
        ]),
      );
    }
  } catch (error) {
    console.log(`Error with OpenAI processing:`, error.message);
  }
}

bot.action('generate_new', async (ctx) => {
  const userId = ctx.from.id;
  // track excessive button clicks to regenerate on the bad keyword input
  if (!buttonClickCount[userId]) {
    buttonClickCount[userId] = 0;
  }

  const tipsMessage = `<b style="color:green;">Sorry, I'm struggling 😓 to come up with a greeting you like</b>\n
    <b>💡Tip:</b> \n Be specific with your keywords. Tell me <b> who </b> is it for, and what's the <b> occasion </b> (e.g. birthday, new home,get better)`;
  if (buttonClickCount[userId] >= 1) {
    ctx.replyWithHTML(tipsMessage);
    return;
  }

  buttonClickCount[userId]++;
  const originalInput = originalUserInput[userId];

  ctx.answerCbQuery('Working on a new greeting...');
  try {
    // Re-generate a new response using the original user input
    const newResponse = await generateGPT(originalInput);
    ctx.answerCbQuery('Generating a new description...');

    const formattedNewResponse = `<b>Ok! What about this one?</b>\n\n${newResponse.content}`;
    ctx.replyWithHTML(
      formattedNewResponse,
      Markup.inlineKeyboard([
        Markup.button.callback(
          "👎 I don't like it. Give me another one!",
          'generate_new',
        ),
      ]),
    );
  } catch (error) {
    console.error('Error with re-generation', error.message);
  }
});





bot.launch();