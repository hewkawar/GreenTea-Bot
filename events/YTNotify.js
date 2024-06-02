const { Events } = require("discord.js");
const YTNotifySchema = require("../schemas/YTNotify");
const { default: axios } = require("axios");
const { parseString } = require("xml2js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        setInterval(async () => {
            const notifies = await YTNotifySchema.find();

            notifies.forEach(async (notify) => {
                const guild = await client.guilds.fetch(notify.GuildId);
                if (!guild) return await YTNotifySchema.deleteOne({ _id: notify._id.toString() });
                const channel = await guild.channels.fetch(notify.ChannelId);
                if (!channel) return await YTNotifySchema.deleteOne({ _id: notify._id.toString() });

                const res = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${notify.YoutubeChannelId}`);

                if (res.status != 200) return await YTNotifySchema.deleteOne({ _id: notify._id.toString() });

                parseString(res.data, async (err, result) => {
                    if (err) {
                        console.error('Error parsing XML:', err);
                        return;
                    }

                    const feed = result.feed;
                    const entries = feed.entry || [];
                    
                    const authorName = feed.author[0].name[0];
                    const authorUrl = feed.author[0].uri[0];

                    const latestEntry = entries[0];
                    const latestVideoId = latestEntry['yt:videoId'][0];

                    if (latestVideoId != notify.LastVideoId && !notify.Notified.includes(latestVideoId)) {
                        const notifyMessage = notify.CustomMessage.replace("{channel}", authorName).replace("{url}", `https://youtu.be/${latestVideoId}`);

                        const updateNotified = notify.Notified.push(latestVideoId);

                        await channel.send(notifyMessage);

                        await YTNotifySchema.updateOne({
                            _id: notify._id.toString()
                        }, {
                            LastVideoId: latestVideoId,
                            Notified: updateNotified
                        });
                    }
                });
            });

        }, 30 * 1000)
    }
}