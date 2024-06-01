const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
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

function getBotUptime() {
    let totalSeconds = process.uptime();
    const uptime = uptimeString(totalSeconds);

    return uptime
}

function getSystemUptime() {
    let totalSeconds = os.uptime();
    const uptime = uptimeString(totalSeconds);

    return uptime
}

function getSystemInfo() {
    const cpuName = os.cpus()[0].model;
    const cpuLoad = getCpuLoad();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedMemPercentage = (usedMem / totalMem) * 100;

    const totalMemGB = (totalMem / (1024 ** 3)).toFixed(2);
    const usedMemGB = (usedMem / (1024 ** 3)).toFixed(2);
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(2);

    const uptime = getSystemUptime();

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

function uptimeString(totalSeconds) {
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let string = "";

    if (days > 0) {
        string += `${days} days, `;
    }

    if (hours > 0) {
        string += `${hours} hours, `;
    }

    if (minutes > 0) {
        string += `${minutes} minutes, `;
    }

    if (seconds > 0) {
        string += `${seconds} seconds`;
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
        const BotUptime = getBotUptime();

        const system = getSystemInfo();

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle("Green Tea Information")
                    .addFields(
                        {
                            name: "Developer(s)",
                            value: `\`\`\`${botInfo.developers.map(developer => developer.name).join(", ")}\`\`\``,
                            inline: true
                        },
                        {
                            name: "Bot Version",
                            value: `\`\`\`v${package.version}\`\`\``,
                            inline: true
                        },
                        {
                            name: "Database",
                            value: `\`\`\`${mongoose.connection ? "🟢" : "🔴"} MongoDB\`\`\``,
                            inline: true
                        },
                        {
                            name: "System",
                            value: `\`\`\`CPU: ${system.cpu.name}\nCPU Load: ${system.cpu.load.toFixed(2)}%\nRAM: ${system.ram.useGB} GB / ${system.ram.totalGB} GB\nRAM Used: ${system.ram.usePercentage.toFixed(2)}%\`\`\``,
                            inline: false
                        },
                        {
                            name: "Server(s)",
                            value: `\`\`\`${client.guilds.cache.size.toLocaleString()}\`\`\``,
                            inline: true
                        },
                        {
                            name: "Shard(s)",
                            value: `\`\`\`${client.shard.count}\`\`\``,
                            inline: true
                        },
                        {
                            name: "Bot Uptime",
                            value: `\`\`\`${BotUptime}\`\`\``,
                            inline: false
                        },
                        {
                            name: "System Uptime",
                            value: `\`\`\`${system.uptime}\`\`\``,
                            inline: false
                        }
                    )
            ]
        });
    }
}