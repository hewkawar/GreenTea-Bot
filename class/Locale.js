const en_US = require("../locales/en-US.json");
const th = require("../locales/th.json");

class Locale {
    locale = "en-US";

    constructor(locale) {
        this.locale = locale;
    }

    getLocaleString(id) {
        try {
            switch (this.locale) {
                case "th":
                    if (th[id]) return th[id];
                    else if (en_US[id]) return en_US[id];
                    else return "Placeholder Locale";
                default:
                    if (en_US[id]) return en_US[id];
                    else return "Placeholder Locale";
            }
        } catch (err) {
            return "Placeholder Locale";
        }
    }

    replacePlaceholders(template, data) {
        return template.replace(/{(\d+)}/g, (match, number) => {
            return typeof data[number] !== 'undefined' ? data[number] : match;
        });
    }

    getDefaultString(id) {
        try {
            if (en_US[id]) return en_US[id];
            else return "Placeholder Locale";
        } catch (err) {
            return "Placeholder Locale";
        }
    }
}

module.exports = {
    Locale
}