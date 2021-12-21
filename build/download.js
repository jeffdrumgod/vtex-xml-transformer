"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var https_1 = __importDefault(require("https"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var rimraf_1 = __importDefault(require("rimraf"));
function Download(url, dest) {
    return __awaiter(this, void 0, void 0, function () {
        var tmpFolder;
        return __generator(this, function (_a) {
            tmpFolder = path_1.default.dirname(dest);
            fs_1.default.readdir(tmpFolder, function (err, files) {
                files === null || files === void 0 ? void 0 : files.forEach(function (file, index) {
                    fs_1.default.stat(path_1.default.join(tmpFolder, file), function (err, stat) {
                        var endTime, now;
                        if (err) {
                            return console.error(err);
                        }
                        now = new Date().getTime();
                        endTime = new Date(stat.ctime).getTime() + 60000 * 10;
                        if (now > endTime) {
                            return (0, rimraf_1.default)(path_1.default.join(tmpFolder, file), function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                            });
                        }
                    });
                });
            });
            // download proccess
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var file = fs_1.default.createWriteStream(dest, { flags: "wx" });
                    var request = https_1.default.get(url, function (response) {
                        if (response.statusCode === 200) {
                            response.pipe(file);
                        }
                        else {
                            file.close();
                            fs_1.default.unlink(dest, function () { }); // Delete temp file
                            reject("Server responded with ".concat(response.statusCode, ": ").concat(response.statusMessage));
                        }
                    });
                    request.on("error", function (err) {
                        file.close();
                        fs_1.default.unlink(dest, function () { }); // Delete temp file
                        reject(err.message);
                    });
                    file.on("finish", function () {
                        resolve(dest);
                    });
                    file.on("error", function (err) {
                        file.close();
                        fs_1.default.unlink(dest, function () { }); // Delete temp file
                        reject(err.message);
                    });
                })];
        });
    });
}
exports.default = Download;
