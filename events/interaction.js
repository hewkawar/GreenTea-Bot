const { Events } = require("discord.js");
const { name } = require("./ready");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.log(error);
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            }
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isModalSubmit()) {
            let modal;
            if (interaction.customId.startsWith("YTN")) {
                modal = require(`../models/YTNotifyModel`);
            } else {
                modal = require(`../models/${interaction.customId}`);
            }

            if (!modal) return;

                try {
                    await modal.execute(interaction, client);
                } catch (error) {
                    console.log(error);
                    await interaction.reply({
                        content: 'There was an error while executing this modal!',
                        ephemeral: true
                    });
                }
        }
    }
}