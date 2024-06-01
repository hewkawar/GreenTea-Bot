const YTNotifySchema = require("../schemas/YTNotify");
const { Colors, EmbedBuilder } = require("discord.js");

module.exports = {
    async execute(interaction, client) {
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
                                .setDescription(`Unsubscribed from **${data.YoutubeChannelId}** in <#${data.ChannelId}>`)
                        ],
                        ephemeral: true
                    });

                    if (interaction.message && interaction.message.deletable) {
                        await interaction.message.delete();
                    }
                } catch (error) {
                    if (error.code !== 'InteractionAlreadyReplied') {
                        console.error('Error handling delete action:', error);
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
                                .setDescription(`Edited Message to \`\`\`${editedMessage}\`\`\``)
                        ],
                        ephemeral: true
                    });

                    if (interaction.message && interaction.message.deletable) {
                        await interaction.message.delete();
                    }
                } catch (error) {
                    if (error.code !== 'InteractionAlreadyReplied') {
                        console.error('Error handling edit message action:', error);
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
                                .setDescription(`Reseted Message to \`\`\`New video from **{channel}**!\n{url}\`\`\``)
                        ],
                        ephemeral: true
                    });

                    if (interaction.message && interaction.message.deletable) {
                        await interaction.message.delete();
                    }
                } catch (error) {
                    if (error.code !== 'InteractionAlreadyReplied') {
                        console.error('Error handling reset message action:', error);
                    }
                }
                break;
        }
    }
}
