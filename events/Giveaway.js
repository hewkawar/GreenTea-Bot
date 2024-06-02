const { Events, EmbedBuilder, Colors } = require("discord.js");
const Giveaway = require("../schemas/Giveaway");
const GiveawayStatusType = require('../data/GiveawayStatusType.json');
const { Locale } = require("../class/Locale");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        async function updateGiveaway() {
            const locale = new Locale();
            const giveawayList = await Giveaway.find({
                Status: GiveawayStatusType.Online
            });

            giveawayList.forEach(async (giveaway) => {
                const now = Date.now();
                if (giveaway.Status != GiveawayStatusType.Online || giveaway.EndsAt >= now) return;

                const guild = await client.guilds.fetch(giveaway.GuildId);
                const channel = await guild.channels.fetch(giveaway.ChannelId);
                const message = await channel.messages.fetch(giveaway.MessageId);

                const winnerList = [];

                if (!message) {
                    await Giveaway.deleteOne({
                        MessageId: giveaway.MessageId
                    });
                    return;
                };

                const reactions = message.reactions.cache;

                reactions.forEach(async (reaction) => {
                    if (reaction.emoji.name != "🎉") return;

                    await reaction.users.fetch()
                        .then(users => {
                            const userlist = users.map(user => user.id);

                            const playerList = userlist.filter(user => !client.user.id.includes(user));

                            if (playerList.length <= giveaway.Winner) {
                                winnerList.push(...playerList);
                            } else {
                                const shuffledPlayers = playerList.sort(() => Math.random() - 0.5);
                                winnerList.push(...shuffledPlayers.slice(0, giveaway.Winner));
                            }
                        });

                    await Giveaway.deleteOne({
                        MessageId: giveaway.MessageId
                    });

                    const mentions = winnerList.map(userId => `<@${userId}>`);

                    try {
                        if (winnerList.length == 0) {
                            await channel.send({ content: locale.replacePlaceholders(locale.getDefaultString("event.giveaway.end.nowinner"), [giveaway.Reward]) })
                        } else {
                            await channel.send({ content: locale.replacePlaceholders(locale.getDefaultString("event.giveaway.send"), [mentions.join(', '), giveaway.Reward]) });
                        }
    
                        const oldEmbed = new EmbedBuilder(message.embeds[0]);
    
                        await message.edit({
                            embeds: [
                                oldEmbed.setColor(Colors.NotQuiteBlack).addFields(
                                    {
                                        name: "The Winners",
                                        value: `${winnerList.length == 0 ? locale.replacePlaceholders(locale.getDefaultString("event.giveaway.end.nowinner"), [giveaway.Reward]) : mentions.join(', ')}`
                                    }
                                )
                            ]
                        });
                    } catch (err) { }
                });
            })
        }

        setInterval(updateGiveaway, 5 * 1000)
    }
}