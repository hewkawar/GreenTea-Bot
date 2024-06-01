const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Latency of the bot")
    .setDescriptionLocalizations({
        th: "เวลาแฝงของบอท"
    }),
    async execute(interaction, client) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`**🏓 ปอง!** ตีกลับมาแล้ว`)
                .addFields(
                    {
                        name: "Latency",
                        value: `\`\`\`${(Date.now() - interaction.createdTimestamp).toLocaleString()} ms\`\`\``,
                        inline: true
                    },
                    {
                        name: "API",
                        value: `\`\`\`${Math.round(client.ws.ping).toLocaleString()} ms\`\`\``,
                        inline: true
                    }
                )
            ]
        });
    }
}