const { models, model, Schema } = require("mongoose");

module.exports = models.Giveaway || model("Giveaway", new Schema({
    Reward: String,
    Winner: Number,
    Description: String,
    WinnerList: [String],
    MessageId: String,
    ChannelId: String,
    GuildId: String,
    Status: String,
    EndsAt: Date,
    CreateBy: String,
}, {
    timestamps: true
}))