const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invite Bot")
    .setDescriptionLocalizations({
        th: "เชิญบอท"
    }),
    async execute(interaction, client) {
        const inviteUrl = new URL("https://discord.com/oauth2/authorize");
        inviteUrl.searchParams.set("client_id", client.user.id);

        await interaction.reply(inviteUrl.toString());
    }
}