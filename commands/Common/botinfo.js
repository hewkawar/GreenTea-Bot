const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { Locale } = require("../../class/Locale");
const mongoose = require("mongoose");
const os = require("os");

const botInfo = require("../../data/info.json");
const package = require("../../package.json");

function getCpuLoad() {
    const cpus = os.cpus();

    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;

    for (let cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }

    const total = user + nice + sys + idle + irq;
    const usage = ((total - idle) / total) * 100;

    return usage;
}

function getBotUptime(locale) {
    let totalSeconds = process.uptime();
    const uptime = uptimeString(totalSeconds, locale);

    return uptime
}

function getSystemUptime(locale) {
    let totalSeconds = os.uptime();
    const uptime = uptimeString(totalSeconds, locale);

    return uptime
}

function getSystemInfo(locale) {
    const cpuName = os.cpus()[0].model;
    const cpuLoad = getCpuLoad();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedMemPercentage = (usedMem / totalMem) * 100;

    const totalMemGB = (totalMem / (1024 ** 3)).toFixed(2);
    const usedMemGB = (usedMem / (1024 ** 3)).toFixed(2);
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(2);

    const uptime = getSystemUptime(locale);

    return {
        cpu: {
            name: cpuName,
            load: cpuLoad
        },
        ram: {
            total: totalMem,
            free: freeMem,
            use: usedMem,
            totalGB: totalMemGB,
            useGB: usedMemGB,
            freeGB: freeMemGB,
            usePercentage: usedMemPercentage
        },
        uptime: uptime
    }
}

function uptimeString(totalSeconds, locale) {
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let string = "";

    if (days > 0) {
        string += `${days} ${locale.getLocaleString("time.days")}, `;
    }

    if (hours > 0) {
        string += `${hours} ${locale.getLocaleString("time.hours")}, `;
    }

    if (minutes > 0) {
        string += `${minutes} ${locale.getLocaleString("time.minutes")}, `;
    }

    if (seconds > 0) {
        string += `${seconds} ${locale.getLocaleString("time.seconds")}`;
    }

    if (string.endsWith(", ")) {
        string = string.slice(0, -2);
    }

    return string;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Bot Infomation")
        .setDescriptionLocalizations({
            th: "ข้อมูลบอท"
        }),
    async execute(interaction, client) {
        const locale = new Locale(interaction.locale);

        const BotUptime = getBotUptime(locale);

        const system = getSystemInfo(locale);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle(locale.replacePlaceholders(locale.getLocaleString("command.botinfo.infomation"), [client.user.displayName]))
                    .addFields(
                        {
                            name: locale.getLocaleString("command.botinfo.developers"),
                            value: `\`\`\`${botInfo.developers.map(developer => developer.name).join(", ")}\`\`\``,
                            inline: true
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.botversion"),
                            value: `\`\`\`v${package.version}\`\`\``,
                            inline: true
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.database"),
                            value: `\`\`\`${mongoose.connection ? "🟢" : "🔴"} ${locale.getLocaleString("database.mongodb")}\`\`\``,
                            inline: true
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.system"),
                            value: `\`\`\`${locale.getLocaleString("command.botinfo.cpu")}: ${system.cpu.name}\n${locale.getLocaleString("command.botinfo.cpu.load")}: ${system.cpu.load.toFixed(2)}%\n${locale.getLocaleString("command.botinfo.ram")}: ${system.ram.useGB} ${locale.getLocaleString("byte.gb")} / ${system.ram.totalGB} ${locale.getLocaleString("byte.gb")}\n${locale.getLocaleString("command.botinfo.ram.use")}: ${system.ram.usePercentage.toFixed(2)}%\`\`\``,
                            inline: false
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.servers"),
                            value: `\`\`\`${client.guilds.cache.size.toLocaleString()}\`\`\``,
                            inline: true
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.shards"),
                            value: `\`\`\`${client.shard.count}\`\`\``,
                            inline: true
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.bot.uptime"),
                            value: `\`\`\`${BotUptime}\`\`\``,
                            inline: false
                        },
                        {
                            name: locale.getLocaleString("command.botinfo.system.uptime"),
                            value: `\`\`\`${system.uptime}\`\`\``,
                            inline: false
                        }
                    )
            ]
        });
    }
}