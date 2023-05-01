const Todoist = require('todoist').v9;
const todoist = Todoist(process.env.TODOIST_API_KEY);

async function CompleteTodoistTasks(tasks) {

    await todoist.sync();
    const items = todoist.items.get();

    tasks.forEach(async task => {
        const concreteIteme = items.find(item => item.content === task.title && item.completed_at === null);
        if (concreteIteme === null || concreteIteme === undefined) {
            return;
        }

        await todoist.items.complete({ id: concreteIteme.id });
        console.log("completed " + task.title);
    })

}
module.exports = { CompleteTodoistTasks }