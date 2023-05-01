// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { CompleteTodoistTasks } = require('./todoist');
const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_TOKEN
})

async function update() {
    console.time("update");
    const tasks = await getTasksFromNotionDatabase();
    const currentDate = new Date();
    const filteredTasks = tasks.filter(
        (task) => task.isDone && (new Date(task.last_edited_time) < currentDate)
    );
    await CompleteTodoistTasks(filteredTasks);
    console.log(filteredTasks);
    console.timeEnd("update");
}

/**
* Gets tasks from the database.
*
* @returns {Promise<Array<{ pageId: string, status: string, title: string }>>}
*/
async function getTasksFromNotionDatabase() {
    const pages = []
    let cursor = undefined

    while (true) {
        const { results, next_cursor } = await notion.databases.query({
            database_id: process.env.NOTION_INBOX_DB_ID,
            start_cursor: cursor,
        })
        pages.push(...results)
        if (!next_cursor) {
            break
        }
        cursor = next_cursor
    }
    console.log(`${pages.length} pages successfully fetched.`)

    const tasks = []
    for (const page of pages) {
        const pageId = page.id

        const donePropertyId = page.properties["Done"].id
        const donePropertyItem = await getPropertyValue({
            pageId,
            propertyId: donePropertyId,
        })
        const isDone = donePropertyItem.checkbox;
        if (!isDone) {
            continue;
        }

        const lastEditedPropertyId = page.properties["Last edited time"].id
        const lastEditedPropertyItem = await getPropertyValue({
            pageId,
            propertyId: lastEditedPropertyId,
        })
        const last_edited_time = lastEditedPropertyItem.last_edited_time;

        const titlePropertyId = page.properties["Name"].id
        const titlePropertyItems = await getPropertyValue({
            pageId,
            propertyId: titlePropertyId,
        })
        const title = titlePropertyItems
            .map(propertyItem => propertyItem.title.plain_text)
            .join("")

        tasks.push({ pageId, isDone, last_edited_time, title })
    }

    return tasks
}

/**
 * If property is paginated, returns an array of property items.
 *
 * Otherwise, it will return a single property item.
 *
 * @param {{ pageId: string, propertyId: string }}
 * @returns {Promise<PropertyItemObject | Array<PropertyItemObject>>}
 */
async function getPropertyValue({ pageId, propertyId }) {
    const propertyItem = await notion.pages.properties.retrieve({
        page_id: pageId,
        property_id: propertyId,
    })

    if (propertyItem.object === "property_item") {
        return propertyItem
    }

    // Property is paginated.
    let nextCursor = propertyItem.next_cursor
    const results = propertyItem.results

    while (nextCursor !== null) {
        const propertyItem = await notion.pages.properties.retrieve({
            page_id: pageId,
            property_id: propertyId,
            start_cursor: nextCursor,
        })

        nextCursor = propertyItem.next_cursor
        results.push(...propertyItem.results)
    }

    return results
}

module.exports = { update }