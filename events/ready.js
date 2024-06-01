const { Events, ActivityType } = require("discord.js");
const package = require("../package.json");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        client.user.setPresence({ activities: [{ name: `/help | V${package.version}`, type: ActivityType.Playing }] });

        console.log(`[${client.shard.ids}] Ready! Logged in as ${client.user.tag}`);

        setInterval(() => {
            client.user.setPresence({ activities: [{ name: `/help | V${package.version}`, type: ActivityType.Playing }] });
        }, 20 * 1000);
    }
}