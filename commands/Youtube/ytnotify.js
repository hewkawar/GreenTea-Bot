const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, ComponentType, TextInputBuilder, TextInputStyle } = require("discord.js");
const { parseString } = require("xml2js");
const ytsr = require("ytsr");
const axios = require("axios");

const YTNotifySchema = require("../../schemas/YTNotify");
const { Locale } = require("../../class/Locale");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ytnotify")
        .setDescription("YTNotify")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName("add")
            .setDescription("Add a notification to a channel")
            .setDescriptionLocalizations({
                th: "เพิ่มการแจ้งเตือนไปยังช่อง"
            })
            .addStringOption(option => option
                .setName("youtube_channel")
                .setDescription("Youtube Channel Name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addChannelOption(option => option
                .setName("discord_channel")
                .setDescription("Discord channel to notify")
                .setDescriptionLocalizations({
                    th: "ช่องสำหรับส่งการแจ้งเตือน"
                })
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
            )
        )
        .addSubcommand(sub => sub
            .setName("list")
            .setDescription("List all notifications, Also shows delete button")
            .setDescriptionLocalizations({
                th: "แสดงรายการการแจ้งเตือนทั้งหมด, รวมถึงแสดงปุ่มลบด้วย"
            })
        ),
    async autocomplete(interaction, client) {
        const { options } = interaction;
        const focusedOption = options.getFocused(true);

        if (focusedOption.name === "youtube_channel") {
            const query = focusedOption.value;
            if (!query) return;

            try {
                const filters = await ytsr.getFilters(query);
                const filter = filters.get("Type").get("Channel");
                const searchResults = await ytsr(filter.url, { limit: 5 });
                const results = searchResults.items.map(choice => ({ name: `${choice.name}${choice.verified ? " ✅" : ""} - ${choice.subscribers}`, value: choice.channelID }));

                await interaction.respond(results).catch(() => { });
            } catch (error) {
                console.error("Error in autocomplete:", error);
            }
        }
    },
    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);
        const { options } = interaction;
        const sub = options.getSubcommand();

        switch (sub) {
            case "add":
                await interaction.deferReply({ ephemeral: true });
                const discordChannel = options.getChannel("discord_channel");
                const ytChannelId = options.getString("youtube_channel");

                const ytUrl = new URL("https://www.youtube.com/feeds/videos.xml");
                ytUrl.searchParams.set("channel_id", ytChannelId);

                try {
                    const ytChannel = await axios.get(ytUrl.toString());

                    if (ytChannel.status == 200) {
                        parseString(ytChannel.data, async (err, result) => {
                            if (err) {
                                console.error('Error parsing XML:', err);
                                return await interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor(Colors.Red)
                                            .setDescription(locale.replacePlaceholders(locale.getLocaleString("command.ytnotify.add.fail.notfound"), [discordChannel, ytChannelId]))
                                        ]
                                });;
                            }

                            const entries = result.feed.entry || [];
                            const latestEntry = entries[0];
                            const latestVideoId = latestEntry['yt:videoId'][0];

                            const profileUrl = `https://www.youtube.com/channel/${ytChannelId}`;

                            await YTNotifySchema.create({
                                GuildId: interaction.guildId,
                                ChannelId: discordChannel.id,
                                YoutubeChannelId: ytChannelId,
                                LastVideoId: latestVideoId,
                                CustomMessage: "New video from **{channel}**!\n{url}"
                            });

                            await interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(Colors.Red)
                                        .setDescription(locale.replacePlaceholders(locale.getLocaleString("command.ytnotify.add.success"), [discordChannel, profileUrl]))
                                    ]
                            });
                        });
                    } else {
                        return await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(Colors.Red)
                                    .setDescription(locale.replacePlaceholders(locale.getLocaleString("command.ytnotify.add.fail.notfound"), [discordChannel, ytChannelId]))
                                ]
                        });
                    }
                } catch (err) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.Red)
                                .setDescription(locale.replacePlaceholders(locale.getLocaleString("command.ytnotify.add.fail.notfound"), [discordChannel, ytChannelId]))
                        ]
                    });
                }
                break;
            case "list":
                await interaction.deferReply();

                try {
                    const subscriptions = await YTNotifySchema.find({
                        GuildId: interaction.guildId
                    });

                    if (subscriptions.length === 0) {
                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(Colors.Red)
                                    .setTitle(locale.getLocaleString("command.ytnotify.list.nonotifications"))
                                    .setDescription(locale.getLocaleString("command.ytnotify.list.nonotifications.description"))
                            ]
                        });
                        return;
                    }

                    const subscription = subscriptions[0];
                    const res = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${subscription.YoutubeChannelId}`);

                    parseString(res.data, async (err, result) => {
                        if (err) {
                            console.error('Error parsing XML:', err);
                            return;
                        }

                        const feed = result.feed;
                        const authorName = feed.author[0].name[0];
                        const authorUrl = feed.author[0].uri[0];

                        const deleteBtn = new ButtonBuilder()
                            .setCustomId("delete")
                            .setLabel(locale.getLocaleString("command.ytnotify.list.button.delete"))
                            .setEmoji("🗑️")
                            .setStyle(ButtonStyle.Danger);

                        const editMessageBtn = new ButtonBuilder()
                            .setCustomId("editMessage")
                            .setLabel(locale.getLocaleString("command.ytnotify.list.button.editMessage"))
                            .setEmoji("✏️")
                            .setStyle(ButtonStyle.Secondary);

                        const resetMessageBtn = new ButtonBuilder()
                            .setCustomId("resetMessage")
                            .setLabel(locale.getLocaleString("command.ytnotify.list.button.resetMessage"))
                            .setEmoji("🔃")
                            .setStyle(ButtonStyle.Secondary);

                        const testBtn = new ButtonBuilder()
                            .setCustomId("testNotification")
                            .setLabel(locale.getLocaleString("command.ytnotify.list.button.testNotification"))
                            .setEmoji("🔔")
                            .setStyle(ButtonStyle.Primary);

                        const guildChannelsPromises = subscriptions.map(async (subscription) => {
                            const res = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${subscription.YoutubeChannelId}`);
                            const discordChannel = await client.channels.fetch(subscription.ChannelId);

                            if (!discordChannel) {
                                await YTNotifySchema.deleteMany({
                                    ChannelId: subscription.ChannelId
                                });
                                return;
                            }

                            return new Promise((resolve, reject) => {
                                parseString(res.data, (err, result) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    const feed = result.feed;
                                    const authorName = feed.author[0].name[0];
                                    const authorUrl = feed.author[0].uri[0];

                                    resolve({
                                        id: subscription._id.toString(),
                                        discordChannelId: discordChannel,
                                        author: {
                                            id: subscription.YoutubeChannelId,
                                            name: authorName,
                                            url: authorUrl
                                        }
                                    });
                                });
                            });
                        });

                        const guildChannels = await Promise.all(guildChannelsPromises);

                        const selectmenu = new StringSelectMenuBuilder()
                            .setCustomId("channelSelector")
                            .setPlaceholder(locale.getLocaleString("command.ytnotify.list.selectmenu.channelSelector.placeholder"));

                        guildChannels.map((channel) => {
                            const option = new StringSelectMenuOptionBuilder().setLabel(`${channel.author.name} - #${channel.discordChannelId.name}`).setValue(channel.id);
                            selectmenu.addOptions(option);
                        });

                        const rowButton = new ActionRowBuilder()
                            .addComponents(deleteBtn, editMessageBtn, resetMessageBtn, testBtn);

                        const rowSelectMenu = new ActionRowBuilder()
                            .addComponents(selectmenu);

                        const message = await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(Colors.Red)
                                    .setTitle(locale.getLocaleString("command.ytnotify.list.subsctiptionmanager"))
                                    .addFields(
                                        {
                                            name: locale.getLocaleString("command.ytnotify.list.subsctiptionmanager.channel"),
                                            value: `**[${authorName}](${authorUrl})**`,
                                            inline: true
                                        },
                                        {
                                            name: locale.getLocaleString("command.ytnotify.list.subsctiptionmanager.discordchannel"),
                                            value: `<#${subscription.ChannelId}>`,
                                            inline: true
                                        },
                                        {
                                            name: locale.getLocaleString("command.ytnotify.list.subsctiptionmanager.message"),
                                            value: `\`\`\`${subscription.CustomMessage}\`\`\``,
                                            inline: false
                                        }
                                    )
                                    .setFooter({
                                        text: subscription._id.toString()
                                    })
                            ],
                            components: [rowButton, rowSelectMenu]
                        });

                        const collector = message.createMessageComponentCollector({ time: 60_000 });

                        collector.on("collect", async (i) => {
                            if (i.user.id === interaction.user.id) {
                                const managerEmbed = new EmbedBuilder(i.message.embeds[0]);

                                const selectedId = managerEmbed.data.footer.text;

                                if (i.customId == "delete") {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`YTN_1_${selectedId}_${message.id}`)
                                        .setTitle(locale.getLocaleString("command.ytnotify.list.dialog.delete.title"));

                                    const confirmInput = new TextInputBuilder()
                                        .setCustomId("confirmInput")
                                        .setLabel(locale.getLocaleString("command.ytnotify.list.dialog.delete.confirmInput"))
                                        .setStyle(TextInputStyle.Short)
                                        .setMaxLength(6)
                                        .setMinLength(6)
                                        .setRequired(true)
                                        .setPlaceholder(locale.getLocaleString("command.ytnotify.list.dialog.delete.confirmInput.placeholder"));

                                    const confirmActionRow = new ActionRowBuilder().addComponents(confirmInput);

                                    modal.addComponents(confirmActionRow);

                                    await i.showModal(modal);
                                } else if (i.customId == "editMessage") {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`YTN_2_${selectedId}_${message.id}`)
                                        .setTitle(locale.getLocaleString("command.ytnotify.list.dialog.editMessage.title"));

                                    const oldData = await YTNotifySchema.findById(selectedId);

                                    const messageInput = new TextInputBuilder()
                                        .setCustomId("messageInput")
                                        .setLabel(locale.getLocaleString("command.ytnotify.list.dialog.editMessage.messageInput"))
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setRequired(true)
                                        .setValue(oldData.CustomMessage)
                                        .setPlaceholder(locale.getLocaleString("command.ytnotify.list.dialog.editMessage.messageInput.placeholder"));

                                    const messageInputActionRow = new ActionRowBuilder().addComponents(messageInput);

                                    modal.addComponents(messageInputActionRow);

                                    await i.showModal(modal);
                                } else if (i.customId == "resetMessage") {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`YTN_3_${selectedId}_${message.id}`)
                                        .setTitle(locale.getLocaleString("command.ytnotify.list.dialog.resetMessage.title"));

                                    const confirmInput = new TextInputBuilder()
                                        .setCustomId("confirmInput")
                                        .setLabel(locale.getLocaleString("command.ytnotify.list.dialog.resetMessage.confirmInput"))
                                        .setStyle(TextInputStyle.Short)
                                        .setMaxLength(5)
                                        .setMinLength(5)
                                        .setRequired(true)
                                        .setPlaceholder(locale.getLocaleString("command.ytnotify.list.dialog.resetMessage.confirmInput.placeholder"));

                                    const confirmActionRow = new ActionRowBuilder().addComponents(confirmInput);

                                    modal.addComponents(confirmActionRow);

                                    await i.showModal(modal);
                                } else if (i.customId == "testNotification") {
                                    const data = await YTNotifySchema.findById(selectedId);

                                    const guild = await client.guilds.fetch(data.GuildId);
                                    if (!guild) return;
                                    const channel = await guild.channels.fetch(data.ChannelId);
                                    if (!channel) return;

                                    const notifyMessage = data.CustomMessage.replace("{channel}", "CalvinHarrisVEVO").replace("{url}", "https://youtu.be/ozv4q2ov3Mk")

                                    await channel.send(notifyMessage);

                                    await i.reply({
                                        content: locale.replacePlaceholders(locale.getLocaleString("command.ytnotify.list.testNotification.sended"), [data.ChannelId]),
                                        ephemeral: true
                                    });

                                    await message.delete();
                                }

                                if (i.customId == "channelSelector") {
                                    const dataId = i.values[0];

                                    const data = await YTNotifySchema.findById(dataId);

                                    if (!data) return;

                                    const res = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${data.YoutubeChannelId}`);

                                    parseString(res.data, async (err, result) => {
                                        if (err) {
                                            reject(err);
                                            return;
                                        }
                                        const feed = result.feed;
                                        const authorName = feed.author[0].name[0];
                                        const authorUrl = feed.author[0].uri[0];


                                        await message.edit({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor(Colors.Red)
                                                    .setTitle(locale.getLocaleString("command.ytnotify.list.subsctiptionmanager"))
                                                    .addFields(
                                                        {
                                                            name: locale.getLocaleString("command.ytnotify.list.subsctiptionmanager.channel"),
                                                            value: `**[${authorName}](${authorUrl})**`,
                                                            inline: true
                                                        },
                                                        {
                                                            name: locale.getLocaleString("command.ytnotify.list.subsctiptionmanager.discordchannel"),
                                                            value: `<#${data.ChannelId}>`,
                                                            inline: true
                                                        },
                                                        {
                                                            name: locale.getLocaleString("command.ytnotify.list.subsctiptionmanager.message"),
                                                            value: `\`\`\`${data.CustomMessage}\`\`\``,
                                                            inline: false
                                                        }
                                                    )
                                                    .setFooter({
                                                        text: data._id.toString()
                                                    })
                                            ],
                                        });

                                        await i.reply({
                                            content: locale.getLocaleString("command.ytnotify.list.channelSelector.success"),
                                            ephemeral: true
                                        });
                                    });
                                }
                            } else {
                                await i.reply({ content: locale.replacePlaceholders(locale.getLocaleString("command.ytnotify.list.onlyownercaninteraction"), [interaction.user.id]), ephemeral: true });
                            }
                        });

                        collector.on("end", async (collected) => {
                            try {
                                await message.delete();
                            } catch (err) { }
                        });
                    });
                } catch (error) {
                    console.error("Error in execute:", error);
                }
                break;
        }
    }
}
