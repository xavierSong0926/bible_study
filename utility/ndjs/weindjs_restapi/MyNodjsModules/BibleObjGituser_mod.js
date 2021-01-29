

const fs = require('fs');
const path = require('path');
var url = require('url');
const fsPromises = require("fs").promises;

//var Uti = require("./Uti.module").Uti;
//var SvcUti = require("./SvcUti.module").SvcUti;
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

//var btoa = require('btoa');
const crypto = require('crypto')

const NodeCache = require("node-cache");


const WorkingRootNodeName = "bist"
var BibleUti = {
    WorkingRootDir: function (v) {
        if (undefined === v) {
            return BibleUti.m_rootDir
        } else {
            BibleUti.m_rootDir = v
        }
    },

    GetFilesAryFromDir: function (startPath, deep, cb) {//startPath, filter
        function recursiveDir(startPath, deep, outFilesArr) {
            var files = fs.readdirSync(startPath);
            for (var i = 0; i < files.length; i++) {
                var filename = path.join(startPath, files[i]);
                //console.log(filename);
                var stat = fs.lstatSync(filename);
                if (stat.isDirectory()) {
                    if (deep) {
                        recursiveDir(filename, deep, outFilesArr); //recurse
                    }
                    continue;
                }/////////////////////////
                else if (cb) {
                    //console.log("file:",filename)
                    if (!cb(filename)) continue
                }
                outFilesArr.push(filename);
            };
        };/////////////////////////////////////

        var outFilesArr = [];
        recursiveDir(startPath, deep, outFilesArr);
        return outFilesArr;
    },
    access_dir: function (http, dir) {
        function writebin(pathfile, contentType, res) {
            var content = fs.readFileSync(pathfile)
            //console.log("read:", pathfile)
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content, 'binary')
            res.end()
        }
        function writetxt(pathfile, contentType, res) {
            var content = fs.readFileSync(pathfile, "utf8")
            //console.log("read:", pathfile)
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(content, 'utf-8')
            res.end()
        }
        // ./assets/ckeditor/ckeditor.js"
        // var dir = "./assets/ckeditor/"
        console.log("lib svr:", dir)
        var ftypes = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.eot': 'appliaction/vnd.ms-fontobject',
            '.ttf': 'aplication/font-sfnt'
        }
        var binaries = [".png", ".jpg", ".wav", ".mp3", ".svg", ".pdf", ".eot"]
        BibleUti.GetFilesAryFromDir(dir, true, function (fname) {
            var ret = path.parse(fname);
            var ext = ret.ext
            //console.log("ret:",ret)
            if (ftypes[ext]) {
                console.log("base:", ret.base)
                console.log("api:", fname)
                http.use("/" + fname, async (req, res) => {
                    console.log('[post] resp write :', req.body, fname)
                    if (binaries.indexOf(ext) >= 0) {
                        writebin(fname, ftypes[ext], res)
                    } else {
                        writetxt(fname, ftypes[ext], res)
                    }
                })
                return true
            }
        });
    },
    GetFileStat: function (fnm) {
        if (fs.existsSync(fnm)) {
            const stats = fs.statSync(fnm);
            return stats;//.size; //mtime modifited
        }
        return { size: -1, mtime: 0 };
    },
    exec_Cmd: function (command) {
        return new Promise((resolve, reject) => {
            try {
                //command = "ls"
                //console.log('exec_Cmd:', command)
                exec(command, (err, stdout, stderr) => {
                    console.log('-exec_Cmd errorr:', err)
                    console.log('-exec_Cmd stderr:', stderr)
                    console.log('-exec_Cmd stdout:', stdout)

                    // the *entire* stdout and stderr (buffered)
                    //resolve(stdout);
                    resolve({
                        stdout: stdout,
                        stderr: stderr,
                        err: err
                    })

                });
            } catch (err) {
                console.log(err)
                reject(err);
            }
        })
    },
    execSync_Cmd: function (command) {
        try {
            //command = "ls"
            console.log('execSync Cmd:', command)
            var ret = execSync(command).toString();
            console.log(ret)
        } catch (error) {
            console.log("error:", error.status);  // 0 : successful exit, but here in exception it has to be greater than 0
            console.log("error:", error.message); // Holds the message you typically want.
            console.log("error:", error.stderr);  // Holds the stderr output. Use `.toString()`.
            console.log("error:", error.stdout);  // Holds the stdout output. Use `.toString()`.
        }
        return ret;
    },








    copy_biobj: function (BibleObj, oj) {
        //console.log("copy_biobj oj", JSON.stringify(oj, null, 4))
        if (!oj || Object.keys(oj).length === 0) return BibleObj
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(oj)) {
            if (!chpObj || Object.keys(chpObj).length === 0) {
                retOb[bkc] = BibleObj[bkc] //copy whole book
                continue
            }
            retOb[bkc] = {}
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                //console.log("bc", bkc, chp)
                if (!vrsObj || Object.keys(vrsObj).length === 0) {
                    retOb[bkc][chp] = BibleObj[bkc][chp]  //copyy whole chapter
                    continue
                }
                retOb[bkc][chp] = {}
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    //console.log(`${key}: ${value}`);
                    retOb[bkc][chp][vrs] = BibleObj[bkc][chp][vrs]
                }
            }
        }
        return retOb
    },
    convert_Tbcv_2_bcvT: function (rbcv, bcvRobj) {
        if (null === bcvRobj) bcvRobj = {}
        for (const [rev, revObj] of Object.entries(rbcv)) {
            for (const [vol, chpObj] of Object.entries(revObj)) {
                if (!bcvRobj[vol]) bcvRobj[vol] = {}
                for (const [chp, vrsObj] of Object.entries(chpObj)) {
                    if (!bcvRobj[vol][chp]) bcvRobj[vol][chp] = {}
                    for (const [vrs, txt] of Object.entries(vrsObj)) {
                        if (!bcvRobj[vol][chp][vrs]) bcvRobj[vol][chp][vrs] = {}
                        bcvRobj[vol][chp][vrs][rev] = txt
                    };
                };
            };
        };
        return bcvRobj;
    },

    search_str_in_bcvT: function (bcvR, Fname, searchStrn) {
        function _parse_global_parm(searchPat) {
            var arsrmat = searchPat.match(/^\/(.*)\/([a-z]*)$/)
            var exparm = "g"
            if (arsrmat && arsrmat.length === 3) {
                console.log(arsrmat)
                searchPat = arsrmat[1]
                exparm += arsrmat[2]
            }
            return { searchPat: searchPat, parm: exparm };
        }
        var parsePat = _parse_global_parm(searchStrn)
        console.log("searchStrn=", searchStrn)
        function _parse_AND(searchPat) {
            var andary = []
            var andmat = searchPat.match(/[\(][\?][\=][\.][\*]([^\)]+)[\)]/g)   //(?=.*Sarai)(?=.*Abram)
            if (andmat) {
                console.log(andmat)
                andmat.forEach(function (fand) {
                    var cors = fand.match(/(?:[\(][\?][\=][\.][\*])([^\)]+)([\)])/)
                    if (cors.length === 3) andary.push(cors[1])
                    console.log("cors", cors)
                })
            }
            return andary;
        }
        var andary = _parse_AND(searchStrn)
        console.log("andary:", andary)


        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bcvR)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, revObj] of Object.entries(vrsObj)) {
                    var bFound = false
                    for (const [rev, txt] of Object.entries(revObj)) {
                        if (rev === Fname) {
                            var rep = new RegExp(parsePat.searchPat, parsePat.parm);
                            var mat = txt.match(rep);
                            if (mat) {
                                mat.forEach(function (s, i) {
                                    //if (s.length > 0) console.log(i, s)
                                })
                                bFound = true
                                var txtFound = txt

                                if (andary.length === 0) {
                                    var repex = new RegExp(mat[0], parsePat.parm)
                                    txtFound = txt.replace(repex, "<font class='matInSvr'>" + mat[0] + "</font>");
                                } else {
                                    andary.forEach(function (strkey) {
                                        var repex = new RegExp(strkey, parsePat.parm)
                                        txtFound = txtFound.replace(repex, "<font class='matInSvr'>" + strkey + "</font>");
                                    })
                                }

                                bcvR[bkc][chp][vrs][rev] = txtFound
                            }
                        }
                    }
                    if (bFound) {
                        for (const [rev, txt] of Object.entries(revObj)) {
                            if (!retOb[bkc]) retOb[bkc] = {}
                            if (!retOb[bkc][chp]) retOb[bkc][chp] = {};//BibleObj[bkc][chp]
                            if (!retOb[bkc][chp][vrs]) retOb[bkc][chp][vrs] = {};//BibleObj[bkc][chp]
                            retOb[bkc][chp][vrs][rev] = txt
                        }
                    }
                }
            }
        }
        return retOb
    },
    search_str_in_bibObj__not_used: function (bibObj, searchStrn) {
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bibObj)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    var rep = new RegExp(searchStrn, "g");
                    var mat = txt.match(rep);
                    if (mat) {
                        var txtFound = txt.replace(mat[0], "<font class='matInSvr'>" + mat[0] + "</font>");

                        if (!retOb[bkc]) retOb[bkc] = {}
                        if (!retOb[bkc][chp]) retOb[bkc][chp] = {};//BibleObj[bkc][chp]
                        if (!retOb[bkc][chp][vrs]) retOb[bkc][chp][vrs] = {};//BibleObj[bkc][chp]
                        retOb[bkc][chp][vrs][rev] = txtFound
                    }
                }
            }
        }
        return retOb
    },
    bcv_parser: function (sbcv, txt) {
        sbcv = sbcv.replace(/\s/g, "");
        if (sbcv.length === 0) return alert("please select an item first.");
        var ret = { vol: "", chp: "", vrs: "" };
        var mat = sbcv.match(/^(\w{3})\s{,+}(\d+)\s{,+}[\:]\s{,+}(\d+)\s{,+}$/);
        var mat = sbcv.match(/^(\w{3})\s+(\d+)\s+[\:]\s+(\d+)\s+$/);
        var mat = sbcv.match(/^(\w{3})(\d+)\:(\d+)$/);
        if (mat) {
            ret.vol = mat[1].trim();
            ret.chp = "" + parseInt(mat[2]);
            ret.vrs = "" + parseInt(mat[3]);
        } else {
            alert("sbcv=" + sbcv + "," + JSON.stringify(ret));
        }
        ret.chp3 = ret.chp.padStart(3, "0");
        ret._vol = "_" + ret.vol;

        ret.std_bcv = `${ret.vol}${ret.chp}:${ret.vrs}`

        var pad3 = {}
        pad3.chp = ret.chp.padStart(3, "0");
        pad3.vrs = ret.vrs.padStart(3, "0");
        pad3.bcv = `${ret.vol}${pad3.chp}:${pad3.vrs}`
        ret.pad3 = pad3

        var obj = {}
        obj[ret.vol] = {}
        obj[ret.vol][ret.chp] = {}
        obj[ret.vol][ret.chp][ret.vrs] = txt
        ret.bcvObj = obj

        ///////validation for std bcv.
        // if (undefined === _Max_struct[ret.vol]) {
        //     ret.err = `bkc not exist: ${ret.vol}`
        // } else if (undefined === _Max_struct[ret.vol][ret.chp]) {
        //     ret.err = `chp not exist: ${ret.chp}`
        // } else if (undefined === _Max_struct[ret.vol][ret.chp][ret.vrs]) {
        //     ret.err = `vrs not exist: ${ret.vrs}`
        // } else {
        //     ret.err = ""
        // }

        return ret;
    },


    loadObj_by_fname: function (jsfnm) {
        var ret = { obj: null, fname: jsfnm, fsize: -1, header: "", err: "" };

        if (!fs.existsSync(jsfnm)) {
            console.log("f not exit:", jsfnm)
            return ret;
        }
        ret.stat = BibleUti.GetFileStat(jsfnm)
        ret.fsize = ret.stat.size;
        if (ret.fsize > 0) {
            var t = fs.readFileSync(jsfnm, "utf8");
            var i = t.indexOf("{");
            if (i > 0) {
                ret.header = t.substr(0, i);
                var s = t.substr(i);
                try {
                    ret.obj = JSON.parse(s);
                } catch (e) {
                    ret.err = e;
                }

            }
        }

        ret.writeback = function () {
            var s2 = JSON.stringify(this.obj, null, 4);
            fs.writeFileSync(this.fname, this.header + s2);
            ret.dlt_size = ret.header.length + s2.length - ret.fsize
        }
        return ret;
    },
    inpObj_to_karyObj: function (inpObj) {
        var keyObj = { kary: [] }
        for (const [bkc, chpObj] of Object.entries(inpObj)) {
            keyObj.bkc = bkc
            keyObj.kary.push(bkc)
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                keyObj.chp = chp
                keyObj.kary.push(chp)
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    keyObj.vrs = vrs
                    keyObj.txt = txt
                    keyObj.kary.push(vrs)
                    keyObj.kary.push(txt)
                }
            }
        }
        return keyObj;
    },

    ____________Write2vrs_txt_by_inpObj__________: function (jsfname, doc, inpObj, bWrite) {
        var out = {}
        var bib = BibleUti.loadObj_by_fname(jsfname);
        out.m_fname = bib.fname

        if (bib.fsize > 0) {
            console.log("fsize:", bib.fsize)
            for (const [bkc, chpObj] of Object.entries(inpObj)) {
                console.log("chpObj", chpObj)
                for (const [chp, vrsObj] of Object.entries(chpObj)) {
                    console.log("vrsObj", vrsObj)
                    for (const [vrs, txt] of Object.entries(vrsObj)) {
                        var readtxt = bib.obj[bkc][chp][vrs]
                        out.data = { dbcv: `${doc}~${bkc}${chp}:${vrs}`, txt: readtxt }
                        console.log("origtxt", readtxt)

                        if (bWrite) {
                            console.log("newtxt", txt)
                            bib.obj[bkc][chp][vrs] = txt
                            bib.writeback();
                            out.desc += ":Write-success"
                        } else {
                            out.desc += ":Read-success"
                        }
                    }
                }
            }
        }
        return out
    },



    decrypt_txt: function (toDecrypt, privateKey) {
        //const absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey)
        //const privateKey = fs.readFileSync(absolutePath, 'utf8')
        const buffer = Buffer.from(toDecrypt, 'base64')
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey.toString(),
                passphrase: '',
                padding: crypto.constants.RSA_PKCS1_PADDING
            },
            buffer,
        )
        return decrypted.toString('utf8')
    },


    _check_pub_testing: function (inp) {
        if (inp.usr.passcode.length === 0) {
            return inp_usr
        }
        ////SpecialTestRule: repopath must be same as password.
        inp.usr.repopath = inp.usr.repopath.trim()
        const PUB_TEST = "pub_test"
        if (inp.usr_proj.projname.indexOf(PUB_TEST) === 0) {
            if (inp.usr_proj.projname !== inp.usr.passcode && "3edcFDSA" !== inp.usr.passcode) {
                console.log("This is for pub_test only but discord to the rule.")
                return null
            } else {
                console.log("This is for pub_test only: sucessfully pass the rule.")
                inp.usr.passcode = "3edcFDSA"
            }
        }
        return inp
    },
    _deplore_usr_proj_dirs: function (usr_proj, base_Dir) {
        //const base_Dir = "bible_study_notes/usrs"


        usr_proj.base_Dir = base_Dir
        usr_proj.git_root = `${base_Dir}/${usr_proj.hostname}/${usr_proj.username}/${usr_proj.projname}`
        usr_proj.acct_dir = `${base_Dir}/${usr_proj.hostname}/${usr_proj.username}/${usr_proj.projname}/account`
        usr_proj.dest_myo = `${base_Dir}/${usr_proj.hostname}/${usr_proj.username}/${usr_proj.projname}/account/myoj`
        usr_proj.dest_dat = `${base_Dir}/${usr_proj.hostname}/${usr_proj.username}/${usr_proj.projname}/account/dat`


        console.log("deplore: usr_proj=", usr_proj)
    },

    _interpret_repo_url: function (proj_url) {
        //https://github.com/wdingbox/Bible_obj_weid.git
        var reg = new RegExp(/^https\:\/\/github\.com\/(\w+)\/(\w+)(\.git)$/)
        const hostname = "github.com"

        var mat = proj_url.match(/^https\:\/\/github\.com[\/](([^\/]*)[\/]([^\.]*))[\.]git$/)
        if (mat && mat.length === 4) {
            console.log("mat:", mat)
            //return { format: 2, desc: "full_path", full_path: mat[0], user_repo: mat[1], user: mat[2], repo: mat[3] }
            var username = mat[2]
            var projname = mat[3]


            var owner = `_${hostname}_${username}_${projname}`
            return { hostname: hostname, username: username, projname: projname, ownerstr: owner }
        }
        return null
    },

    Parse_inp_out_obj: function () {
        return {
            data: null, desc: "", err: null,
            state: { bGitDir: -1, bMyojDir: -1, bDatDir: -1, bEditable: -1, bRepositable: -1 }
        }
    },
    Parse_POST_req_to_inp: function (req, res, cbf) {
        console.log("req.method", req.method)
        console.log("req.url", req.url)

        //req.pipe(res)
        if (req.method === "POST") {
            //req.pipe(res)
            console.log("POST: ----------------", "req.url=", req.url)
            var body = "";
            req.on("data", function (chunk) {
                body += chunk;
                console.log("on post data:", chunk)
            });

            req.on("end", async function () {
                console.log("on post eend:", body)

                var inpObj = null
                try {
                    inpObj = JSON.parse(body)
                    inpObj.out = BibleUti.Parse_inp_out_obj()
                } catch (err) {
                    inpObj.err = err
                }
                console.log("POST:3 inp=", JSON.stringify(inpObj, null, 4));


                console.log("cbf start ------------------------------")
                await cbf(inpObj)

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify(inpObj))
                res.end();
                console.log("finished post req------------------------------")
            });
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end();
            console.log("end of req")
        }
    },
    Parse_GET_req_to_inp: function (req) {
        console.log("\n\n\n\n\n\n\n\n-----req.method (GET?)", req.method)
        console.log("-GET: req.url=", req.url);
        console.log("-req.query", req.query)
        var remoteAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null);
        console.log("-remoteAddr", remoteAddr)
        console.log("-req.headers", req.headers)
        console.log(req.connection.remoteAddress);


        if (req.method !== "GET") {
            return null
        }
        //console.log("\n\n\n\n---->GET: req.query=", req.query);
        //var q = url.parse(req.url, true).query;
        //console.log("q=", q);
        if ("undefined" === typeof req.query.inp) {
            console.log("req.query.inp: undefined. Maybe initial loading or page transition");
            return null;
        }

        var inpObj = {}
        console.log("req.query.inp=", req.query.inp)
        if (req.query.inp.match(/^CUID\d+\.\d+$/)) { //SignPageLoaded
            inpObj.CUID = req.query.inp
            return inpObj
        } else {
            var d64 = Buffer.from(req.query.inp, 'base64').toString()
            //d64 = Buffer.from(d64, 'base64').toString()
            var sin = decodeURIComponent(d64);//must for client's encodeURIComponent

            var out = BibleUti.Parse_inp_out_obj()
            try {
                var inpObj = JSON.parse(sin);
                inpObj.out = out
                console.log("GET: inp =", JSON.stringify(inpObj, null, 4));
                //cbf(inpObj, res)
                return inpObj
            } catch (err) {
                out.err = err
                console.log(err)
                return out
            }
        }

    },
    //// BibleUti /////
}



var SvrUsrsBCV = function (srcpath) {
    this.m_rootDir = srcpath
    this.output = {
        m_olis: [],
        m_totSize: 0,
        m_totFiles: 0,
        m_totPaths: 0
    }
}
SvrUsrsBCV.prototype.get_paths = function (srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        if ("." === file[0]) return false;
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}
SvrUsrsBCV.prototype.get_files = function (srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        if ("." === file[0]) return false;
        return fs.statSync(srcpath + '/' + file).isFile();
    });
}
SvrUsrsBCV.prototype.getFary = function (srcPath, cbf) {
    var fary = this.get_files(srcPath);
    var dary = this.get_paths(srcPath);
    this.output.m_totPaths += dary.length;
    this.output.m_totFiles += fary.length;

    for (var i = 0; i < dary.length; i++) {
        var spath = dary[i];
        //console.log(spath)
        this.getFary(path.join(srcPath, spath), cbf);
    }
    for (var k = 0; k < fary.length; k++) {
        var sfl = fary[k];
        //console.log("path file :", srcPath, sfl)
        //if (doc !== sfl) continue
        var pathfile = path.join(srcPath, sfl);
        var stats = fs.statSync(pathfile);
        this.output.m_totSize += stats.size;

        if (cbf) cbf(srcPath, sfl)
    }
}
SvrUsrsBCV.prototype.decompose = function (docpathfilname) {
    var ret = path.parse(docpathfilname)
    //console.log(ret)
    var ary = ret.dir.split("/")
    var owner = `_${ary[6]}_${ary[7]}_${ary[8]}`
    var compound = { owner: owner, base: ret.base }
    //console.log("compound", compound)
    return compound
}
SvrUsrsBCV.prototype.gen_crossnet_files_of = function (docpathfilname, cbf) {
    //console.log("spec=", spec)
    this.m_compound = this.decompose(docpathfilname)
    var _This = this
    this.getFary(this.m_rootDir, function (spath, sfile) {
        var pathfile = path.join(spath, sfile);
        var cmpd = _This.decompose(pathfile)
        if (cmpd.base === _This.m_compound.base) {
            _This.output.m_olis.push(pathfile);
            console.log("fnd:", pathfile)
            if (cbf) cbf(spath, sfile)
        }

    })
    return this.output
}









var NCache = {}
NCache.m_checkperiod = 3 //s.
NCache.m_TTL = NCache.m_checkperiod * 10 //seconds
NCache.m_MaxIdleTime = NCache.m_TTL * 10  //TimeToEnd(s).
NCache.myCache = new NodeCache({ checkperiod: NCache.m_checkperiod }); //checkperiod default is 600s.
NCache.Init = function () {
    NCache.myCache.set("test", { publicKey: 1, privateKey: 1, CUID: 1 }, 30)
    //myCache.ttl( "tuid", 3 )
    NCache.myCache.set("test", { publicKey: 1, privateKey: 1, CUID: 1 }, 10)
    //myCache.ttl( "tuid", 6 )
    var obj = NCache.myCache.get("test")
    console.log(obj)

    NCache.myCache.on("del", function (key, val) {
        console.log("\n\n\n\n\n\n\n\n\n\non del")
        console.log("on del NCache.m_TTL=", NCache.m_TTL)
        console.log("on del NCache.m_checkperiod=", NCache.m_checkperiod)
        // ... do something ...
        console.log("on del key=", key)
        console.log("on del val=", val)

        var rootDir = BibleUti.WorkingRootDir();// + WorkingRootNodeName
        console.log("on del rootDir=", rootDir)

        if (!val) return console.log("on del, val=undefined")
        if (!fs.existsSync(rootDir)) return console.log(`existsSync(${rootDir}) not exist.`)
        if (!fs.existsSync(key)) return console.log(`existsSync(${key}) not exist.`)

        console.log("start to del proj_destroy ssid=", key)
        var inp = {}
        inp.usr = val
        inp.out = BibleUti.Parse_inp_out_obj()
        inp.SSID = key
        var userProject = new BibleObjGituser(rootDir)
        if (userProject.parse_inp_usr2proj(inp)) {
            userProject.run_proj_state()
            console.log(inp.out.state)
            if (0 === inp.out.state.bRepositable) {
                //case push failed. Don't delete
                console.log("git dir not exit.")

            } else {
                var res2 = userProject.execSync_cmd_git("git add *")
                var res3 = userProject.execSync_cmd_git(`git commit -m "on del in Cache"`)
                var res4 = userProject.git_push()

                var res5 = userProject.run_proj_destroy()
            }
        }
    });

    NCache.myCache.on("expired", function (key, val) {
        console.log("\n\non expired")
        console.log("on expired NCache.m_TTL=", NCache.m_TTL)
        console.log("on expired NCache.m_checkperiod=", NCache.m_checkperiod)
        console.log("on expired NCache.m_MaxIdleTime=", NCache.m_MaxIdleTime)
        var tms = val.tms
        var cur = (new Date()).getTime()
        var dlt = (cur - tms) / 1000.0 //(s)
        if (dlt > NCache.m_MaxIdleTime) {
            return console.log("------------>>>>>>>>on expired, let it die,dlt=", dlt)
        }
        console.log("on expired, keep alive", dlt)
        NCache.myCache.set(key, val, NCache.m_TTL) //keep it.
    })
}
NCache.Set = function (key, val, ttl) {
    if (undefined === ttl) ttl = NCache.m_TTL
    if ("object" === typeof val) val.tms = (new Date()).getTime() //timestampe for last access.
    this.myCache.set(key, val, ttl) //restart ttl -- reborn again.
}
NCache.Get = function (key, ttl) {
    var val = this.myCache.get(key)
    if (undefined !== val && null !== val) { //0 and "" are allowed.
        this.Set(key, val, ttl) //restart ttl -- reborn again.
    }
    return val
}
NCache.Init()

















var BibleObjGituser = function (rootDir) {
    if (!rootDir.match(/\/$/)) rootDir += "/"
    this.m_rootDir = rootDir


    this.m_sRootNode = WorkingRootNodeName //"bist"
    this.m_sBaseUsrs = `${this.m_sRootNode}/usrs`
    this.m_sBaseTemp = `${this.m_sRootNode}/temp`

    var pathrootdir = rootDir + this.m_sRootNode
    this.m_SvrUsrsBCV = new SvrUsrsBCV(pathrootdir)

}
BibleObjGituser.prototype.genKeyPair = function (cuid) {
    if (!cuid) return
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096, // Note:can encrypt txt len max 501 bytes. 
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        }
    });
    console.log("publicKey\n", publicKey)
    console.log("privateKey\n", privateKey)

    var pkb64 = Buffer.from(publicKey).toString("base64")
    console.log("pkb64\n", pkb64)
    console.log("pkb64.len", pkb64.length)

    //var tuid = this.m_inp.CUID
    var val = { publicKey: publicKey, privateKey: privateKey, pkb64: pkb64, CUID: cuid }

    NCache.Set(cuid, val)
    return val
}




BibleObjGituser.prototype.proj_get_usr_fr_cache_ssid = function (inp) {
    inp.out.state.ssid_cur = inp.SSID
    if (!inp.SSID || inp.SSID.length === 0) {
        return null
    }


    inp.usr = NCache.Get(inp.SSID)
    console.log("inp.SSID:", inp.SSID)
    console.log("inp.usr", inp.usr)
    if (!inp.usr) {
        //inp.out.state.ssid_cur = "timeout"
    }


    //extra work: update repodesc
    if (inp.usr && inp.par) {
        if (inp.par.aux && "string" === typeof inp.par.aux.Update_repodesc) {
            inp.usr.repodesc = inp.par.aux.Update_repodesc
            NCache.Set(inp.SSID, inp.usr)
            console.log(`Update_repodesc ************* = ${inp.usr.repodesc}`)
        }
    }

    return inp.usr
}
BibleObjGituser.prototype.proj_parse_usr_signed = function (inp) {
    this.m_inp = inp
    if (!inp || !inp.out) {
        return null
    }

    if (null === this.proj_get_usr_fr_cache_ssid(inp)) {
        return null
    }
    return this.parse_inp_usr2proj(inp)
}
BibleObjGituser.prototype.proj_get_usr_fr_decipher_cuid = function (inp) {
    console.log("inp.CUID", inp.CUID)
    if (!inp.CUID || inp.CUID.length === 0) return null
    console.log("inp.CUID", inp.CUID)
    var robj = NCache.myCache.take(inp.CUID) //take: for safety delete immediately after use.
    if (!robj) return null
    console.log(robj)

    console.log(inp.cipherusrs)

    var str = BibleUti.decrypt_txt(inp.cipherusrs, robj.privateKey)
    var usrObj = JSON.parse(str)
    console.log("session_decipher_usrs usrObj=")
    console.log(usrObj)
    inp.usr = usrObj
    return inp

}
BibleObjGituser.prototype.proj_parse_usr_signin = function (inp) {
    this.m_inp = inp
    if (!inp || !inp.out) {
        console.log("!inp || !inp.out")
        return null
    }

    if (null === this.proj_get_usr_fr_decipher_cuid(inp)) {
        return null
    }
    return this.parse_inp_usr2proj(inp)
}
BibleObjGituser.prototype.parse_inp_usr2proj = function (inp) {
    if ("object" !== typeof inp.usr) {
        inp.usr_proj = null
        console.log("inp.usr is null")
        return null
    }
    if (!this.m_inp) this.m_inp = inp

    inp.usr_proj = BibleUti._interpret_repo_url(inp.usr.repopath)
    if (!inp.usr_proj) {
        inp.out.desc = "invalid repospath."
        console.log(inp.out.desc)
        return null;
    }
    BibleUti._deplore_usr_proj_dirs(inp.usr_proj, this.m_sBaseUsrs)


    if (null === BibleUti._check_pub_testing(inp)) {
        inp.out.desc = "failed pub test."
        inp.usr_proj = null
        console.log(inp.out.desc)
        return null
    }
    this.parse_inp_usr2proj_final()
    return inp
}
BibleObjGituser.prototype.parse_inp_usr2proj_final = function () {
    var inp = this.m_inp;
    inp.usr_proj.git_Usr_Pwd_Url = ""
    if (inp.usr.passcode.trim().length > 0) {
        inp.usr_proj.git_Usr_Pwd_Url = `https://${inp.usr_proj.username}:${inp.usr.passcode}@${inp.usr_proj.hostname}/${inp.usr_proj.username}/${inp.usr_proj.projname}.git`
    }

    inp.usr.repodesc = inp.usr.repodesc.trim().replace(/[\r|\n]/g, ",")//:may distroy cmdline.
}

BibleObjGituser.prototype.session_get_github_owner = function (docfile) {
    //jspfn: ../../../../bist/usrs/github.com/bsnp21/pub_test01/account/myoj/myNote_json.js
    var ary = docfile.split("/")
    var idx = ary.indexOf("usrs")
    var hostname = ary[idx + 1]
    var username = ary[idx + 2]
    var reponame = ary[idx + 3]
    var owner = username + "/" + reponame
    return owner
}
BibleObjGituser.prototype.session_git_repodesc_load = function (docfile) {
    //jspfn: ../../../../bist/usrs/github.com/bsnp21/pub_test01/account/myoj/myNote_json.js
    var pos = docfile.indexOf("/account/")
    var gitpath = docfile.substr(0, pos)
    console.log("gitpath", gitpath)
    var usrObj = NCache.Get(gitpath)
    if (!usrObj) return null
    console.log("usrObj", usrObj)
    return { repodesc: usrObj.repodesc, pathfile: gitpath }
}

BibleObjGituser.prototype.session_create = function () {
    var gitdir = this.get_usr_git_dir()
    NCache.Set(gitdir, this.m_inp.usr)
    console.log(gitdir, this.m_inp.usr)

    return { SSID: gitdir }
}

BibleObjGituser.prototype.get_proj_tmp_dir = function (subpath) {
    var dir = `${this.m_rootDir}${this.m_sBaseTemp}`
    if (!fs.existsSync(dir)) {
        //fs.mkdirSync(dir, 0777, { recursive: true });
        var password = "lll"
        var command = `
            echo ${password} | sudo -S mkdir -p ${dir}
            echo ${password} | sudo -S chmod 777 ${dir}
            `
        var ret = BibleUti.execSync_Cmd(command)
        console.log(ret)
    }
    return `${dir}${subpath}`
}
BibleObjGituser.prototype.get_usr_acct_dir = function (subpath) {
    if (!this.m_inp.usr_proj) return ""
    if (!subpath) {
        return `${this.m_rootDir}${this.m_inp.usr_proj.acct_dir}`
    }
    return `${this.m_rootDir}${this.m_inp.usr_proj.acct_dir}${subpath}`
}
BibleObjGituser.prototype.get_usr_myoj_dir = function (subpath) {
    if (!this.m_inp.usr_proj) return ""
    if (!subpath) {
        return `${this.m_rootDir}${this.m_inp.usr_proj.dest_myo}`
    }
    return `${this.m_rootDir}${this.m_inp.usr_proj.dest_myo}${subpath}`
}
BibleObjGituser.prototype.get_usr_dat_dir = function (subpath) {
    if (!this.m_inp.usr_proj) return ""
    if (!subpath) {
        return `${this.m_rootDir}${this.m_inp.usr_proj.dest_dat}`
    }
    return `${this.m_rootDir}${this.m_inp.usr_proj.dest_dat}${subpath}`
}

BibleObjGituser.prototype.get_usr_git_dir = function (subpath) {
    if (!this.m_inp.usr_proj) return ""
    if (undefined === subpath || null === subpath) {
        return `${this.m_rootDir}${this.m_inp.usr_proj.git_root}`
    }
    //if (subpath[0] !== "/") subpath = "/" + subpath
    return `${this.m_rootDir}${this.m_inp.usr_proj.git_root}${subpath}`
}

BibleObjGituser.prototype.get_DocCode_Fname = function (DocCode) {
    if (DocCode[0] != "_") return ""
    var fnam = DocCode.substr(1)
    return `${fnam}_json.js`
}
BibleObjGituser.prototype.get_pfxname = function (DocCode) {
    var inp = this.m_inp
    //var DocCode = inp.par.fnames[0]
    if (!DocCode || !inp.usr_proj) return ""
    var dest_pfname = ""
    switch (DocCode[0]) {
        case "_": //: _myNode, _myTakeaway,
            {
                var fnam = this.get_DocCode_Fname(DocCode)
                dest_pfname = this.get_usr_myoj_dir(`/${fnam}`)
            }
            break
        case ".": //-: ./dat/localStorage
            {
                var fnam = DocCode.substr(1)
                dest_pfname = this.get_usr_acct_dir(`${fnam}_json.js`)
            }
            break;
        default: //: NIV, CUVS,  
            dest_pfname = `${this.m_rootDir}bible_obj_lib/jsdb/jsBibleObj/${DocCode}.json.js`;
            break;
    }
    return dest_pfname
}
BibleObjGituser.prototype.get_dir_lib_template = function (subpf) {
    var pathfile = `${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate`
    if (undefined === subpf) {
        return pathfile
    }
    return pathfile + subpf
}


var fname = "bible_obj_lib/jsdb/UsrDataTemplate/myoj/myNote_json.js"
console.log("==========test===========", fname)
var mat = fname.match(/[\/]myoj[\/](my[\w]+)_json\.js$/)
if (mat) {
    console.log("=====================     mat", mat[1])

}
BibleObjGituser.prototype.run_makingup_missing_files = function (fnam) {

    function _makeup_missing_myoj_file(dest_pfname, src) {
        if (!fs.existsSync(src)) return console.log(`* * * [src Fatal Err]not existsSync(${src})`)
        if (fs.existsSync(dest_pfname)) return console.log(`already existsSync(${dest_pfname});`)
        ////---:
        //var src = `${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate/myoj/${fnam}`
        console.log("* * * * *  * des:", dest_pfname)
        console.log("* * * * *  * src:", src)
        const { COPYFILE_EXCL } = fs.constants;
        fs.copyFileSync(src, dest_pfname, COPYFILE_EXCL) //failed if des exists.

        if (!fs.existsSync(dest_pfname)) {
            console.log("* * * [Fatal Err] missing file cannot be fixed:", dest_pfname)
        }
    }

    var _THIS = this
    var srcdir = this.get_dir_lib_template()
    BibleUti.GetFilesAryFromDir(srcdir, true, function (fname) {
        var ret = path.parse(fname);
        var ext = ret.ext
        var bas = ret.base
        //console.log(bas)
        //console.log("=====================     fname", fname)
        var mat = fname.match(/[\/]myoj[\/](my[\w]+)_json\.js$/)
        if (mat) {
            //console.log("=====================     mat", mat)
            var doc = "_" + mat[1]
            var gitpfx = _THIS.get_pfxname(doc)
            //console.log("gitpfx", gitpfx)
            _makeup_missing_myoj_file(gitpfx, fname)
        }
        var mat = fname.match(/[\/]dat[\/]([\w]+)_json\.js$/)
        if (mat) {
            //console.log("=====================     mat", mat)
            var doc = mat[1]
            var gitpfx = _THIS.get_pfxname("./dat/"+doc)
            console.log("dat", gitpfx)
            _makeup_missing_myoj_file(gitpfx, fname)
        }
    });
    return
    var src = `${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate/myoj/${fnam}`
    var src_dat = `${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate${fnam}_json.js`
    return dest_pfname
}

BibleObjGituser.prototype.run_proj_setup = function () {
    var inp = this.m_inp
    var proj = inp.usr_proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return null
    }
    inp.out.desc = "setup start."
    var stat = this.run_proj_state()
    if (stat.bEditable === 1) {
        inp.out.desc += "|already setup."
        this.git_pull()
    } else {
        inp.out.state.bNewCloned = 1
        if (stat.bGitDir !== 1) {
            this.git_clone()
            this.git_config_allow_push(false)
            stat = this.run_proj_state()
        } else {
            this.git_pull()
        }

        if (stat.bMyojDir !== 1) {
            this.cp_template_to_git()
            stat = this.run_proj_state()
        }
        if (stat.bDatDir !== 1) {

        }

        if (stat.bMyojDir === 1) {
            var accdir = this.get_usr_acct_dir()
            this.chmod_R_(777, accdir)
        }

    }

    this.chmod_R_777_acct()

    this.run_makingup_missing_files()

    var retp = this.run_proj_state()
    if (retp.bEditable === 1) {
    }

    return inp
}
BibleObjGituser.prototype.run_proj_destroy = function () {
    var inp = this.m_inp
    var proj = inp.usr_proj;
    if (!proj) {
        console.log("failed git setup", inp)
        return inp
    }

    //console.log("proj", proj)
    var gitdir = this.get_usr_git_dir()
    var password = "lll" //dev mac
    var proj_destroy = `
    echo ${password} | sudo -S rm -rf ${gitdir}
    `

    if (fs.existsSync(`${gitdir}`)) {
        inp.out.exec_git_cmd_result = BibleUti.execSync_Cmd(proj_destroy).toString()
        inp.out.desc += "destroyed git dir: " + gitdir
    }

    //this.session_destroy()

    this.run_proj_state()
    return inp
}
BibleObjGituser.prototype.run_proj_state = function (cbf) {
    if (!this.m_inp.out || !this.m_inp.out.state) return console.log("******Fatal Error.")
    var stat = this.m_inp.out.state
    //inp.out.state = { bGitDir: -1, bMyojDir: -1, bEditable: -1, bRepositable: -1 }


    stat.bMyojDir = 1
    var accdir = this.get_usr_myoj_dir()
    if (!fs.existsSync(accdir)) {
        console.log("notExist", accdir)
        stat.bMyojDir = 0
    }


    stat.bDatDir = 1
    var accdir = this.get_usr_dat_dir()
    if (!fs.existsSync(accdir)) {
        console.log("notExist", accdir)
        stat.bDatDir = 0
    }

    stat.bGitDir = 1
    var git_config_fname = this.get_usr_git_dir("/.git/config")
    if (!fs.existsSync(git_config_fname)) {
        console.log("notExist", git_config_fname)
        stat.bGitDir = 0
        stat.bEditable = 0
        stat.bRepositable = 0
        return stat;
    }

    stat.config = this.load_git_config()

    /////// git status
    stat.bEditable = stat.bGitDir * stat.bMyojDir * stat.bDatDir
    this.m_inp.out.state.bRepositable = 0
    if (this.m_inp.usr.passcode.length > 0) {
        //if clone with password ok, it would ok for pull/push 
        stat.bRepositable = 1
    }

    var accdir = this.get_usr_acct_dir()
    var fstat = {}
    var totalsize = 0
    var iAlertLevel = 0
    BibleUti.GetFilesAryFromDir(accdir, true, function (fname) {
        var ret = path.parse(fname);
        var ext = ret.ext
        //console.log("ret:",ret)
        var sta = fs.statSync(fname)
        var fMB = (sta.size / 1000000).toFixed(2)
        totalsize += sta.size
        var str = "" + fMB + "/100(MB)"
        if (fMB >= 80.0) { ////** Github: 100 MB per file, 1 GB per repo, svr:10GB
            var str = ret.base + ":" + fMB + "/100(MB)"
            warnsAry.push(str)
            iAlertLevel = 1
            str += "*"
        }
        if (fMB >= 90.0) { ////** Github: 100 MB per file, 1 GB per repo, svr:10GB
            stat.bMyojDir = 0
            iAlertLevel = 2
            str += "*"
        }
        fstat[ret.base] = str
    });

    stat.fstat = fstat
    stat.repo_usage = (totalsize / 1000000).toFixed(2) + "/1000(MB)"
    stat.repo_alertLevel = iAlertLevel


    if (cbf) cbf()
    return stat
}

BibleObjGituser.prototype.cp_template_to_git = function () {
    var inp = this.m_inp
    var proj = inp.usr_proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    inp.out.desc += ",clone."

    var gitdir = this.get_usr_myoj_dir()
    if (fs.existsSync(`${gitdir}`)) {
        inp.out.desc += ", usr acct already exist: "
        return inp
    }

    //console.log("proj", proj)
    var password = "lll" //dev mac
    var acctDir = this.get_usr_acct_dir()
    var cp_template_cmd = `
    #!/bin/sh
    echo ${password} | sudo -S mkdir -p ${acctDir}
    echo ${password} | sudo -S chmod -R 777 ${acctDir}
    #echo ${password} | sudo -S cp -aR  ${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate  ${acctDir}/
    echo ${password} | sudo -S cp -aR  ${this.m_rootDir}bible_obj_lib/jsdb/UsrDataTemplate/*  ${acctDir}/.
    echo ${password} | sudo -S chmod -R 777 ${acctDir}
    echo " cp_template_cmd end."
    #cd -`

    inp.out.cp_template_cmd = cp_template_cmd
    console.log("cp_template_cmd", cp_template_cmd)
    inp.out.cp_template_cmd_result = BibleUti.execSync_Cmd(cp_template_cmd).toString()

    if (!fs.existsSync(`${gitdir}`)) {
        inp.out.desc += ", cp failed: "
    }
    return inp
}
BibleObjGituser.prototype.chmod_R_777_acct = function () {
    // mode : "777" 
    var inp = this.m_inp
    var proj = inp.usr_proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    var dir = this.get_usr_acct_dir()
    console.log("perm:", dir)
    if (!fs.existsSync(dir)) {
        return inp
    }
    var password = "lll"
    var change_perm_cmd = `echo ${password} | sudo -S chmod -R 777 ${dir}`

    inp.out.change_perm = BibleUti.execSync_Cmd(change_perm_cmd).toString()

    return inp.out.change_perm
}
BibleObjGituser.prototype.chmod_R_ = function (mode, dir) {
    // mode : "777" 
    var inp = this.m_inp
    var proj = inp.usr_proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed git setup", inp.out.desc)
        return inp
    }
    console.log("perm:", dir)
    if (!fs.existsSync(dir)) {
        return inp
    }
    var password = "lll"
    var change_perm_cmd = `echo ${password} | sudo -S chmod -R ${mode} ${dir}`

    inp.out.change_perm = BibleUti.execSync_Cmd(change_perm_cmd).toString()

    return inp.out.change_perm
}

BibleObjGituser.prototype.load_git_config = function () {
    var git_config_fname = this.get_usr_git_dir("/.git/config")
    //if (!this.m_git_config_old || !this.m_git_config_new) {
    var olds, news, txt = fs.readFileSync(git_config_fname, "utf8")
    var ipos1 = txt.indexOf(this.m_inp.usr.repopath)
    var ipos2 = txt.indexOf(this.m_inp.usr_proj.git_Usr_Pwd_Url)

    console.log("ipos1:", ipos1, this.m_inp.usr.repopath)
    console.log("ipos2:", ipos2, this.m_inp.usr_proj.git_Usr_Pwd_Url)

    if (ipos1 > 0) {
        olds = txt
        news = txt.replace(this.m_inp.usr.repopath, this.m_inp.usr_proj.git_Usr_Pwd_Url)
    }
    if (ipos2 > 0) {
        news = txt
        olds = txt.replace(this.m_inp.usr_proj.git_Usr_Pwd_Url, this.m_inp.usr.repopath)

        console.log("initial git_config_fname not normal:", txt)
    }
    if ((ipos1 * ipos2) < 0) {
        this.m_git_config_old = olds
        this.m_git_config_new = news

        //var txt = fs.readFileSync(git_config_fname, "utf8")
        var pos0 = txt.indexOf("[remote \"origin\"]")
        var pos1 = txt.indexOf("\n\tfetch = +refs");//("[branch \"master\"]")
        this.m_inp.out.state.config = txt.substring(pos0 + 19, pos1)
    }
    //}
    return this.m_inp.out.state.config
}


BibleObjGituser.prototype.git_config_allow_push = function (bAllowPush) {
    { /****.git/config
        [core]
                repositoryformatversion = 0
                filemode = true
                bare = false
                logallrefupdates = true
                ignorecase = true
                precomposeunicode = true
        [remote "origin"]
                url = https://github.com/wdingbox/bible_obj_weid.git
                fetch = +refs/heads/*:refs/remotes/origin/*
        [branch "master"]
                remote = origin
                merge = refs/heads/master
        ******/

        //https://github.com/wdingbox/bible_obj_weid.git
        //https://github.com/wdingbox:passcode@/bible_obj_weid.git
    } /////////

    if (!this.m_inp.usr.repopath) return
    if (!this.m_inp.usr_proj) return
    if (!this.m_inp.usr_proj.git_Usr_Pwd_Url) return

    var git_config_fname = this.get_usr_git_dir("/.git/config")
    if (!fs.existsSync(git_config_fname)) {
        console.log(".git/config not exist:", git_config_fname)
        return
    }



    if (!this.m_git_config_old || !this.m_git_config_new) {
        this.load_git_config()
    }

    if (bAllowPush) {
        fs.writeFileSync(git_config_fname, this.m_git_config_new, "utf8")
        console.log("bAllowPush=1:url =", this.m_inp.usr_proj.git_Usr_Pwd_Url)
    } else {
        fs.writeFileSync(git_config_fname, this.m_git_config_old, "utf8")
        console.log("bAllowPush=0:url =", this.m_inp.usr.repopath)
    }
}

BibleObjGituser.prototype.git_clone = function () {
    var password = "lll" //dev mac
    var _THIS = this
    var inp = this.m_inp
    var proj = inp.usr_proj;
    if (!proj) {
        inp.out.desc += ", failed inp.usr parse"
        console.log("failed-git-parse", inp.out.desc)
        return inp
    }

    inp.out.git_clone_res = { desc: "git-clone", bExist: false }
    var gitdir = this.get_usr_git_dir("/.git")
    if (fs.existsSync(gitdir)) {
        inp.out.git_clone_res.desc += "|already done."
        inp.out.git_clone_res.bExist = true
        return inp
    }


    var clone_https = inp.usr_proj.git_Usr_Pwd_Url
    if (clone_https.length === 0) {
        clone_https = inp.usr.repopath
    }
    if (clone_https.length === 0) {
        inp.out.git_clone_res.desc += ",no url."
        return inp
    }
    console.log("to clone: ", clone_https)

    //console.log("proj", proj)
    gitdir = this.get_usr_git_dir()
    if (fs.existsSync(gitdir)) {
        inp.out.git_clone_res.desc += "|git folder exit but no .git"
        inp.out.git_clone_res.bExist = true
        var ret = BibleUti.execSync_Cmd(`echo ${password} | sudo -S rm -rf ${gitdir}`).toString()
        console.log(ret)
    }


    var git_clone_cmd = `
    #!/bin/sh
    cd ${this.m_rootDir}
    echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git clone  ${clone_https}  ${proj.git_root}
    if [ -f "${proj.git_root}/.git/config" ]; then
        echo "${proj.git_root}/.git/config exists."
        echo ${password} | sudo -S chmod  777 ${proj.git_root}/.git/config
    else 
        echo "${proj.git_root}/.git/config does not exist."
    fi
    `
    console.log("git_clone_cmd...")
    inp.out.git_clone_res.git_clone_cmd = git_clone_cmd
    var ret = BibleUti.execSync_Cmd(git_clone_cmd).toString()
    console.log("ret", ret)
    return inp
}
BibleObjGituser.prototype.git_status = async function (_sb) {
    var inp = this.m_inp
    if (!inp.out.state) return console.log("*** Fatal Error: inp.out.state = null")

    if (undefined === _sb) _sb = ""
    var gitdir = this.get_usr_git_dir("/.git/config")
    if (fs.existsSync(gitdir)) {
        /////// git status
        var git_status_cmd = `
        cd ${this.get_usr_git_dir()}
        git status ${_sb}
        #git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.`

        inp.out.git_status_res = BibleUti.exec_Cmd(git_status_cmd).toString()
    }
}

BibleObjGituser.prototype.git_add_commit_push_Sync = function (msg) {
    var _THIS = this
    var inp = this.m_inp
    var gitdir = this.get_usr_git_dir()
    if (!fs.existsSync(gitdir)) {
        return console.log("gitdir not exists.");
    }

    password = "lll" //dev mac
    var command = `
    #!/bin/bash
    set -x #echo on
    echo '=>cd ${gitdir}'
    cd  ${gitdir}
    echo '=>git status'
    echo ${password} | sudo -S git status
    echo '=>git diff'
    echo ${password} | sudo -S git diff --ignore-space-at-eol -b -w --ignore-blank-lines --color-words=.
    echo '=>git add *'
    echo ${password} | sudo -S git add *
    echo '=>git commit'
    echo ${password} | sudo -S git commit -m "Sync:${msg}. repodesc:${inp.usr.repodesc}"
    echo '=>git push'
    echo ${password} | sudo -S GIT_TERMINAL_PROMPT=0 git push
    echo '=>git status'
    echo ${password} | sudo -S git status
    echo '=>git status -sb'
    echo ${password} | sudo -S git status -sb
    `
    console.log('exec_command:', command)
    console.log('exec_command start:')

    try {
        //e.g. command = "ls"
        _THIS.git_config_allow_push(true)
        exec(command, (err, stdout, stderr) => {
            console.log('\n-exec_Cmd errorr:')
            console.log(err)
            console.log('\n-exec_Cmd stderr:',)
            console.log(stderr)
            console.log('\n-exec_Cmd stdout:')
            console.log(stdout)
            console.log('\n-exec_Cmd end.')
            _THIS.git_config_allow_push(false)
        });
    } catch (err) {
        console.log(err)
    }

    console.log('exec_command END.')
    setTimeout(function () {
        console.log('exec_command ENDED Mark.', gitdir)
    }, 10000)
}

BibleObjGituser.prototype.git_pull = function (cbf) {
    this.git_config_allow_push(true)
    this.m_inp.out.git_pull_res = this.execSync_cmd_git("GIT_TERMINAL_PROMPT=0 git pull")
    this.git_config_allow_push(false)
    //var mat = this.m_inp.out.git_pull_res.stderr.match(/(fatal)|(fail)|(error)/g)
    return this.m_inp.out.git_pull_res
}

BibleObjGituser.prototype.git_push = function () {
    this.git_config_allow_push(true)
    this.m_inp.out.git_push_res = this.execSync_cmd_git("GIT_TERMINAL_PROMPT=0 git push")
    this.git_config_allow_push(false)
    return this.m_inp.out.git_push_res
}

BibleObjGituser.prototype.execSync_cmd_git = async function (gitcmd) {
    var _THIS = this
    var inp = this.m_inp


    if (!fs.existsSync(this.get_usr_git_dir())) {
        inp.out.desc = "no git dir"
        return null
    }


    //console.log("proj", proj)
    var password = "lll" //dev mac
    var scmd = `
    #!/bin/sh
    cd ${this.get_usr_git_dir()}
    echo ${password} | sudo -S ${gitcmd}
    `
    console.log("\n----git_cmd start:>", scmd)
    var res = BibleUti.execSync_Cmd(scmd)
    console.log("\n----git_cmd end.")

    return res
}



module.exports = {
    BibleUti: BibleUti,
    BibleObjGituser: BibleObjGituser
}

