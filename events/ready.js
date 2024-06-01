const { Events, ActivityType } = require("discord.js");
const mongoose = require("mongoose");
const package = require("../package.json");
const mongodbUri = process.env.MONGODB_URI;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        client.user.setPresence({ activities: [{ name: `/help | V${package.version}`, type: ActivityType.Playing }] });

        console.log(`[${client.shard.ids}] Ready! Logged in as ${client.user.tag}`);

        if (mongodbUri) {
            await mongoose.connect(mongodbUri);

            if (mongoose.connection) {
                console.log(`[${client.shard.ids}] ${client.user.tag} have connected to the database!`);
            } else {
                console.log(`[${client.shard.ids}] ${client.user.tag} cannot connect to the database right now...`);
            }
        }

        setInterval(() => {
            client.user.setPresence({ activities: [{ name: `/help | V${package.version}`, type: ActivityType.Playing }] });
        }, 20 * 1000);
    }
}