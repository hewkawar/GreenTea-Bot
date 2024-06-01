const { ShardingManager } = require("discord.js");
require("dotenv").config();

const manager = new ShardingManager("./bot.js", {
    token: process.env.TOKEN
});

manager.on('shardCreate', shard => {
    shard.on('death', () => {
        console.log(`[${shard.id}] is Death`);
        console.log(`[${shard.id}] Reswawning...`)
    })
    console.log(`Launched shard ${shard.id}`);
});

manager.spawn().then(shards => {
    shards.forEach(shard => {
        shard.on('message', message => {
            console.log(`[Message][${shard.id}] : ${message._eval} : ${message._result}`);
        });
    });
}).catch(console.error);