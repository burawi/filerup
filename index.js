var multipart = require('connect-multiparty');
var filesizeParser = require('filesize-parser');
var fs = require('fs');
var path = require('path');

module.exports = function(app) {

    app.use(multipart());

    function mkdir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    }

    function getFile(files, fieldname) {
        var res = null;
        for (var i = 0; i < files.length; i++) {
            if(files[i].fieldName == fieldname)
                res = files[i];
        }
        return res;
    }

    function checkFiles(files, settings) {
        var res = { valid: true, report: {} };
        settings.fields.forEach(function (fieldname) {
            var validity = checkFile(fieldname, files, settings);
            res.report[fieldname] = validity.report;
            if(!validity.valid){
                res.valid = false;
            }
        });
        return res;
    }

    function checkFile(fieldname, files, settings) {
        var res = { valid: true, report: {} };
        var file = getFile(files, fieldname);
        if(file == null){
            res.valid = false;
            res.report.exists = false;
        } else {
            res.report.exists = true;

            if(file.size > settings.maxSize){
                res.valid = false;
                res.report.size = false;
            } else {
                res.report.size = true;
            }
            if(settings.types.length > 0 && settings.types.indexOf(file.ext) == -1){
                res.valid = false;
                res.report.type = false;
            } else {
                res.report.type = true;
            }

        }
        return res;
    }

    function writeFiles(files, settings) {
        var paths = [];
        settings.fields.forEach(function (fieldname) {
            if(checkFile(fieldname, files, settings).valid){
                var file = getFile(files, fieldname);
                fs.writeFileSync(file.distPath, file.content);
                paths.push(file.distPath);
            }
        });
        return paths;
    }

    function clearTmp(req) {
        for (var name in req.files) {
            if (req.files.hasOwnProperty(name)) {
                if(Array.isArray(req.files[name])){
                    req.files[name].forEach(function (file) {
                        fs.unlinkSync(file.path);
                    });
                } else {
                    fs.unlinkSync(req.files[name].path);
                }
            }
        }
    }

    var exports = {};

    exports.upload = function(req,settings) {
        var defaults = {
            fields: [],
            types: [],
            dist: './uploads',
            maxSize: '2Mb',
            together: true
        };
        settings = Object.assign({}, defaults, settings);

        mkdir(settings.dist);
        settings.maxSize = filesizeParser(settings.maxSize);
        settings.together = (settings.together == true) || (settings.together == "true");
        if(settings.fields.length == 0){
            settings.fields = Object.keys(req.files);
        }

        var res = {
            paths: [],
            report: {}
        };
        var files = [];

        settings.fields.forEach(function (fieldname) {
            if (req.files.hasOwnProperty(fieldname)) {

                var fieldFiles = req.files[fieldname];
                if(!Array.isArray(fieldFiles)){
                    fieldFiles = [fieldFiles];
                }

                fieldFiles.forEach(function (file) {
                    file.name = path.parse(file.originalFilename).name;
                    file.ext = path.parse(file.originalFilename).ext.replace('.','');
                    file.distName = file.name + new Date().getTime() + '.' + file.ext;
                    file.distPath = path.resolve(settings.dist, file.distName);
                    file.content = fs.readFileSync(file.path);

                    files.push(file);
                })
            }
        })

        var verify = checkFiles(files, settings)
        res.report = verify.report;

        if(settings.together){
            if(verify.valid){
                res.paths = writeFiles(files, settings);
            }
        } else {
            res.paths = writeFiles(files, settings);
        }

        clearTmp(req);

        return res;
    }

    return exports;
};
