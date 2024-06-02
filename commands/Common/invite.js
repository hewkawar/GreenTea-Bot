const { SlashCommandBuilder, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { Locale } = require("../../class/Locale");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Invite Bot")
        .setDescriptionLocalizations({
            th: "เชิญบอท"
        }),
    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);
        
        const inviteUrl = new URL("https://discord.com/oauth2/authorize");
        inviteUrl.searchParams.set("client_id", client.user.id);

        const invite = new ButtonBuilder()
            .setLabel(locale.getLocaleString("command.invite.invite"))
            .setURL(inviteUrl.toString())
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder()
            .addComponents(invite)

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(locale.replacePlaceholders(locale.getLocaleString("command.invite"), [client.user.displayName, inviteUrl.toString()]))
            ],
            components: [row],
        });
    }
}