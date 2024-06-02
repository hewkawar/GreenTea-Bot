const { models, model, Schema } = require("mongoose");

module.exports = models.YTNotify || model("YTNotify", new Schema({
    GuildId: String,
    ChannelId: String,
    YoutubeChannelId: String,
    LastVideoId: String,
    CustomMessage: String,
    Notified: [String]
}, {
    timestamps: true
}))