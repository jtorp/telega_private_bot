import  { Client } from "@notionhq/client"
import config from 'config'

const notion = new Client({
    auth: config.get('APIKeys.NOTION_TOKEN'),
})




export async function notionCreate(short, metaText) {
    try {
        const dbResponse = await notion.pages.create({
            "icon": {
                "type": "emoji",
                "emoji": "📃"
            },
            parent: {
                database_id: config.DB.NOTION_DB_ID,
            },
            properties: {
                Keywords: {
                    title: [
                        {
                            text: {
                                content: short,
                            },
                        },
                    ],
                },
                Date: {
                    date: {
                        start: new Date().toISOString(),
                    },
                },
            },
        });

        const pageResponse = await notion.blocks.children.append({
            block_id: dbResponse.id,
            children: [
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: metaText,
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return pageResponse;
    } catch (error) {
        console.error("Error creating Notion page:", error);
        throw error;
    }
}