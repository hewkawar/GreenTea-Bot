const { Locale } = require("../class/Locale");
const YTNotifySchema = require("../schemas/YTNotify");
const { Colors, EmbedBuilder } = require("discord.js");

module.exports = {
    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);
        const parts = interaction.customId.split("_");

        const actionType = parts[1];
        const dataId = parts[2];

        switch (actionType) {
            case "1": // Delete
                try {
                    const data = await YTNotifySchema.findByIdAndDelete(dataId);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.Red)
                                .setDescription(locale.replacePlaceholders(locale.getLocaleString("modal.submit.YTNotifyModel.delete.success"), [data.YoutubeChannelId, data.ChannelId]))
                        ],
                        ephemeral: true
                    });

                    try {
                        await interaction.message.delete();
                    } catch (err) { }
                } catch (error) {
                    if (error.code !== 'InteractionAlreadyReplied') {
                        console.error('Error handling delete action:', error);
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(Colors.Red)
                                    .setDescription(locale.getLocaleString("modal.submit.YTNotifyModel.delete.fail"))
                            ],
                            ephemeral: true
                        });
                    }
                }
                break;
            case "2": // Edit Message
                try {
                    const editedMessage = interaction.fields.getTextInputValue("messageInput");
                    await YTNotifySchema.updateOne({ _id: dataId }, {
                        CustomMessage: editedMessage
                    });
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.Red)
                                .setDescription(locale.replacePlaceholders(locale.getLocaleString("modal.submit.YTNotifyModel.editMessage.success"), [editedMessage]))
                        ],
                        ephemeral: true
                    });

                    try {
                        await interaction.message.delete();
                    } catch (err) { }
                } catch (error) {
                    if (error.code !== 'InteractionAlreadyReplied') {
                        console.error('Error handling edit message action:', error);
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(Colors.Red)
                                    .setDescription(locale.getLocaleString("modal.submit.YTNotifyModel.editMessage.fail"))
                            ],
                            ephemeral: true
                        });
                    }
                }
                break;
            case "3":
                try {
                    await YTNotifySchema.updateOne({ _id: dataId }, {
                        CustomMessage: "New video from **{channel}**!\n{url}"
                    });
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.Red)
                                .setDescription(locale.getLocaleString("modal.submit.YTNotifyModel.resetMessage.success"))
                        ],
                        ephemeral: true
                    });

                    try {
                        await interaction.message.delete();
                    } catch (err) { }
                } catch (error) {
                    if (error.code !== 'InteractionAlreadyReplied') {
                        console.error('Error handling reset message action:', error);
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(Colors.Red)
                                    .setDescription(locale.getLocaleString("modal.submit.YTNotifyModel.resetMessage.fail"))
                            ],
                            ephemeral: true
                        });
                    }
                }
                break;
        }
    }
}
