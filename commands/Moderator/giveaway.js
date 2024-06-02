const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, Colors } = require("discord.js");
const { Locale } = require("../../class/Locale");
const Giveaway = require("../../schemas/Giveaway");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Giveaway")
        .setDescriptionLocalizations({
            th: "กิจกรรมแจกของ"
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName("create")
            .setDescription("Create new Giveaway")
            .setDescriptionLocalizations({ th: "สร้างกิจกรรมแจกของใหม่" })
        )
        .addSubcommand(sub => sub
            .setName("end")
            .setDescription("Immediately end a giveaway")
            .setDescriptionLocalizations({ th: "สิ้นสุดการแจกทันที" })
            .addStringOption(option => option
                .setName("message")
                .setDescription("Message Id/Link")
                .setDescriptionLocalizations({
                    th: "Id ข้องความ/ลิ้งค์"
                })
                .setRequired(true)
            )
        ),

    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);

        const sub = interaction.options.getSubcommand();

        if (sub == "create") {
            const modal = new ModalBuilder()
                .setCustomId('giveaway_create')
                .setTitle(locale.getLocaleString("command.giveaway.create.title"));

            const duration = new TextInputBuilder()
                .setCustomId('period')
                .setLabel(locale.getLocaleString("command.giveaway.create.period"))
                .setPlaceholder(locale.getLocaleString("command.giveaway.create.period.placeholder"))
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const winners = new TextInputBuilder()
                .setCustomId('winners')
                .setLabel(locale.getLocaleString("command.giveaway.create.winner"))
                .setPlaceholder(locale.getLocaleString("command.giveaway.create.winner.placeholder"))
                .setValue("1")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reward = new TextInputBuilder()
                .setCustomId('reward')
                .setLabel(locale.getLocaleString("command.giveaway.create.reward"))
                .setPlaceholder(locale.getLocaleString("command.giveaway.create.reward.placeholder"))
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const description = new TextInputBuilder()
                .setCustomId('description')
                .setLabel(locale.getLocaleString("command.giveaway.create.description"))
                .setPlaceholder(locale.getLocaleString("command.giveaway.create.description.placeholder"))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const durationActionRow = new ActionRowBuilder().addComponents(duration);
            const winnersActionRow = new ActionRowBuilder().addComponents(winners);
            const rewardActionRow = new ActionRowBuilder().addComponents(reward);
            const descriptionActionRow = new ActionRowBuilder().addComponents(description);

            modal.addComponents(durationActionRow, winnersActionRow, rewardActionRow, descriptionActionRow);

            await interaction.showModal(modal);
        } else if (sub == "end") {
            const messageId = interaction.options.getString("message");

            const parts = messageId.split('/');

            const lastPart = parts[parts.length - 1];

            const giveaway = await Giveaway.findOne({
                MessageId: lastPart
            });

            if (!giveaway) return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setTitle(locale.getLocaleString("command.giveaway.end.notfound"))
                ],
                ephemeral: true
            });

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

                await interaction.reply({
                    ephemeral: true,
                    content: locale.getLocaleString("command.giveaway.end.success")
                });

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
        }
    }
}