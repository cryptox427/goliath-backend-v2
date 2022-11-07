var tough = require('tough-cookie');

module.exports = class CookieJar {
    constructor() {
        this.cookies = {};
    }

    setCookieSync(cookieString) {
        if (cookieString.includes('Max-Age=0;')) return;
        var cookie = tough.parse(cookieString);

        if (
            (cookie.maxAge <= 0 && cookie.maxAge != null) ||
            (cookie.expires != 'Infinity' && cookie.expires.getTime() < Date.now())
        ) {
            return;
        }
        this.cookies[cookie.key] = cookie;
    }

    updateCookies() {
        for (const cookieName in this.cookies) {
            var cookie = this.cookies[cookieName];
            var expired = false;

            if (cookie.expires != 'Infinity') expired = cookie.expired.getTime() < Date.now();
        }
    }

    getCookieStringSync() {
        var cookieString = '';

        for (const cookieName in this.cookies) {
            cookieString += `${cookieName}=${this.cookies[cookieName].value}; `;
        }
        return cookieString;
    }

    setCookieValue(key, value) {
        if (this.cookies[key]) {
            this.cookies[key].value = value;
        } else {
            this.setCookieSync(`${key}=${value}`);
        }
    }

    getCookie(key) {
        return this.cookies[key];
    }

    getCookieValue(key) {
        if (!this.cookies[key]) return null;
        return this.cookies[key].value;
    }

    removeCookie(key) {
        delete this.cookies[key];
    }
};
