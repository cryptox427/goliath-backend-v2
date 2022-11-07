var path = require('path');

module.exports.init = function () {
    if (global.proteusTLSMiddleware) {
        return global.proteusTLSMiddleware; //init allready done
    }

    var platforms = {
        win32: {
            lib: 'windows.dll',
            binding: 'windows',
        },
        darwin: {
            lib: 'darwin.dylib',
            binding: 'darwin',
        },
        linux: {
            lib: 'linux.so',
            binding: 'linux',
        },
    };

    if (!platforms[process.platform]) throw 'unsupported platform ' + process.platform;

    var binding;
    if(process.platform === 'darwin') {
        if(process.arch === 'x64') {
            binding = require(path.join(__dirname,`./gyp/${platforms[process.platform].binding}_arm.node`));
        } else {
            binding = require(path.join(__dirname,`./gyp/${platforms[process.platform].binding}.node`));
        }
    } else{
        binding = require(`./gyp/${platforms[process.platform].binding}.node`);
    }


    var res;

    if(process.platform === 'darwin') {
        if(process.arch === 'x64') {
            res = JSON.parse(binding.loadLib(path.join(__dirname, 'bin', `darwin_arm.dylib`)));
        } else {
            res = JSON.parse(binding.loadLib(path.join(__dirname, 'bin', `${platforms[process.platform].lib}`)));
        }
    } else{
        res = JSON.parse(binding.loadLib(path.join(__dirname, 'bin', `${platforms[process.platform].lib}`)));
    }

    if (!res.Success) throw 'load lib error: ' + res.Error;

    global.proteusTLSMiddleware = class NAPIMiddleware {
        static initClient(config) {
            return new Promise((resolve, reject) => {
                binding.initClient(JSON.stringify(config), (err, response) => {
                    if (err) reject(err);
                    else {
                        res = JSON.parse(response);
                        if (res.Error) reject(res.Error);
                        else resolve(res);
                    }
                });
            });
        }

        static changeProxy(config) {
            return new Promise((resolve, reject) => {
                binding.changeProxy(JSON.stringify(config), (err, response) => {
                    if (err) reject(err);
                    else {
                        res = JSON.parse(response);
                        if (res.Error) reject(res.Error);
                        else resolve(res);
                    }
                });
            });
        }

        static cancelRequests(config) {
            return new Promise((resolve, reject) => {
                binding.cancelRequests(config, (err, response) => {
                    if (err) reject(err);
                    else {
                        res = JSON.parse(response);
                        if (res.Error) reject(res.Error);
                        else resolve(res);
                    }
                });
            });
        }

        static request(config) {
            return new Promise((resolve, reject) => {
                binding.request(JSON.stringify(config), (err, response) => {
                    if (err) reject(err);
                    else {
                        var res;
                        try {
                            res = JSON.parse(response);
                        } catch (error) {}
                        if (res.Error) reject(res.Error);
                        else resolve(res);
                    }
                });
            });
        }
    };

    return global.proteusTLSMiddleware;
};
