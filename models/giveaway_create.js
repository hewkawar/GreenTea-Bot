const { EmbedBuilder, Colors } = require('discord.js');
const moment = require('moment');
const { Locale } = require('../class/Locale');
const Giveaway = require('../schemas/Giveaway');
const GiveawayStatusType = require('../data/GiveawayStatusType.json');

function convertStringToDate(inputString) {
    const [number, unit] = inputString.split(' ');

    const num = parseInt(number);

    const futureDate = moment().add(num, unit);

    const dateString = futureDate.format('YYYY-MM-DD HH:mm:ss');

    return {
        date: futureDate.toDate(),
        dateString: dateString
    };
}

module.exports = {
    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);

        const period = interaction.fields.getTextInputValue("period");
        const winners = parseInt(interaction.fields.getTextInputValue("winners"));
        const reward = interaction.fields.getTextInputValue("reward");
        const description = interaction.fields.getTextInputValue("description");

        const ends = convertStringToDate(period);

        const giveawayEmbed = new EmbedBuilder()
            .setTitle(`🎉 ${reward}`)
            .setColor(Colors.Blue)
            .addFields(
                {
                    name: "Ends",
                    value: `<t:${Math.floor(ends.date / 1000)}:R> (<t:${Math.floor(ends.date / 1000)}:f>)`
                },
                {
                    name: "Winners",
                    value: `${winners.toLocaleString()}`
                },
                {
                    name: "Hosted by",
                    value: `${interaction.user}`
                }
            )
            .setThumbnail('https://cdn.jsdelivr.net/gh/hewkawar/GreenTea-Bot@main/assets/tada.png')
            .setTimestamp(ends.date);
        
        if (description) giveawayEmbed.setDescription(description);

        const message = await interaction.channel.send({
            embeds: [giveawayEmbed]
        });

        await interaction.reply({ content: locale.replacePlaceholders(locale.getLocaleString("modal.submit.giveaway.create.success"), [message.id]), ephemeral: true });

        await Giveaway.create({
            Reward: reward,
            Winner: winners,
            Description: description,
            MessageId: message.id,
            ChannelId: message.channel.id,
            GuildId: message.guild.id,
            EndsAt: ends.date,
            Status: GiveawayStatusType.Online,
            CreateBy: interaction.user.id
        });

        await message.react("🎉");
    }
}