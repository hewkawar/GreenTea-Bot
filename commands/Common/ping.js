const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { Locale } = require("../../class/Locale");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Latency of the bot")
    .setDescriptionLocalizations({
        th: "เวลาแฝงของบอท"
    }),
    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`**🏓 ${locale.getLocaleString("command.ping.pong")}!**`)
                .addFields(
                    {
                        name: locale.getLocaleString("command.ping.latency"),
                        value: `\`\`\`${(Date.now() - interaction.createdTimestamp).toLocaleString()} ${locale.getLocaleString("time.ms")}\`\`\``,
                        inline: true
                    },
                    {
                        name: locale.getLocaleString("command.ping.api"),
                        value: `\`\`\`${Math.round(client.ws.ping).toLocaleString()} ${locale.getLocaleString("time.ms")}\`\`\``,
                        inline: true
                    }
                )
            ]
        });
    }
}