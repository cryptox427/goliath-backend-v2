module.exports = class Headers {
    constructor(rawHeaders) {
        this.rawHeaders = rawHeaders;
        this.headers = {};

        for (const headerName in rawHeaders) this.headers[headerName.toLowerCase()] = rawHeaders[headerName];
    }

    get(name) {
        return this.headers[name.toLowerCase()];
    }

    has(name) {
        return this.headers.hasOwnProperty(name.toLowerCase());
    }

    static transformHeadersToArray(rawHeaders) {
        var outHeaders = [];

        for (const headerName in rawHeaders) {
            outHeaders.push([headerName, rawHeaders[headerName]]);
        }

        return outHeaders;
    }

    static headerContains(headers, key) {
        for (const headerEntry of headers) {
            if (headerEntry[0].toLowerCase() == key.toLowerCase()) return true;
        }

        return false;
    }
};
