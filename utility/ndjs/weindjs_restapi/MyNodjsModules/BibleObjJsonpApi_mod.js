//2018/05/12 MyNodejsModuels/Uti.module.js

const fs = require('fs');
const path = require('path');
var url = require('url');

var Uti = require("./Uti.module").Uti;
//var SvcUti = require("./SvcUti.module").SvcUti;




var BibleUti = {
    ValideBibleObjFiles: {
        __history_verses_loaded: "__history_verses_loaded",
        __history_regex_search: "__history_regex_search"
    },
    get_usr_pathfile: function (username, RevCode) {
        var pthf = `../../../../bible_obj_usr/account/${username}/${RevCode}_json.js`
        if (!fs.existsSync(pthf)) {
            Uti.MakePathDirOfFile(pthf)
        }
        return pthf;
    },
    get_bibleObj_pathfilename: function (fname) {
        var spathfile = "../../../jsdb/jsBibleObj/H_G.json.js";
        spathfile = "../../../../bible_obj_lib/jsdb/jsBibleObj/" + fname + ".json.js";
        var ret = Uti.GetJsonStringFrmFile(spathfile);
        return spathfile;
    },
    xxxxxload_BibleObj: function (fname) {
        var ret = BibleUti.get_bibleObj_pathfilename(fname);
        var bobj = JSON.parse(ret.jstrn);
        ret.obj = bobj;
        ret.writeback = function () {
            fs.writeFileSync(this.fname, this.header + JSON.stringify(this.obj, null, 4), "utf8");
        };
        return ret;
    },
    load_BibleMaxStruct: function () {
        var spathfile = "../../../../bible_obj_lib/jsdb/jsBibleStruct/All_Max_struct_json.js"
        return load_BibleObj(spathfile)
    },
    load_BibleObj: function (revCode) {
        var jsfnm = BibleUti.get_bibleObj_pathfilename(revCode);
        var ret = { obj: null, fname: jsfnm, fsize: -1, header: "", };

        if (!fs.existsSync(jsfnm)) {
            return ret;
        }
        ret.fsize = Uti.GetFileSize(jsfnm);
        if (ret.fsize > 0) {
            var t = fs.readFileSync(jsfnm, "utf8");
            var i = t.indexOf("{");
            if (i > 0) {
                ret.header = t.substr(0, i);
                var s = t.substr(i);
                ret.obj = JSON.parse(s);
            }
        }

        ret.writeback = function () {
            var s2 = JSON.stringify(this.obj, null, 4);
            fs.writeFileSync(this.fname, this.header + s2);
        }
        return ret;
    },






    GetApiInputParamObj: function (req) {
        console.log("req.url=", req.url);
        var q = url.parse(req.url, true).query;
        console.log("q=", q);
        if (q.inp === undefined) {
            console.log("q.inp undefined. Maybe unload or api err");
            return q;
        }
        var s = decodeURIComponent(q.inp);//must for client's encodeURIComponent
        var inpObj = JSON.parse(s);
        console.log("inp=", inpObj);
        return inpObj;
    },
    get_bc: function (BibleObj, oj) {
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(oj)) {
            retOb[bkc] = {}
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                retOb[bkc][chp] = BibleObj[bkc][chp]
                console.log("bc", bkc, chp)
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    //console.log(`${key}: ${value}`);
                }
            }
        }
        return retOb
    },
    convert_rbcv_2_bcvR: function (rbcv, bcvRobj) {
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
    xxxxxxxxxxxxsearch_str_in_bcv: function (bibObj, searchStrn, fileary) {
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bibObj)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, txt] of Object.entries(vrsObj)) {
                    var rep = new RegExp(searchStrn, "g");
                    var mat = txt.match(rep);
                    if (mat) {
                        txt = txt.replace(mat[0], "<font color='red'>" + mat[0] + "</font>");
                        if (!retOb[bkc]) retOb[bkc] = {}
                        if (!retOb[bkc][chp]) retOb[bkc][chp] = {};//BibleObj[bkc][chp]
                        bibObj[bkc][chp][vrs] = txt
                        if (fileary.length > 0) {
                            fileary.forEach(function (rev) {
                                retOb[bkc][chp][vrs] = txt
                            })
                        }
                        //console.log("bc", bkc, chp)
                        //console.log(`${key}: ${value}`);
                    }
                }
            }
        }
        return retOb
    },
    search_str_in_bcvR: function (bcvR, Fname, searchStrn) {
        var retOb = {}
        for (const [bkc, chpObj] of Object.entries(bcvR)) {
            for (const [chp, vrsObj] of Object.entries(chpObj)) {
                for (const [vrs, revObj] of Object.entries(vrsObj)) {
                    var bFound = false
                    for (const [rev, txt] of Object.entries(revObj)) {
                        if (rev === Fname) {
                            var rep = new RegExp(searchStrn, "g");
                            var mat = txt.match(rep);
                            if (mat) {
                                bFound = true
                                var txtFound = txt.replace(mat[0], "<font color='red'>" + mat[0] + "</font>");
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
            return retOb
        }
    }
    //// BibleUti /////
}



var ApiJsonp_BibleObj = {
    ApiBibleObj_update_notes: function (inpObj) {
        var fil = inpObj.fnames[0];
        var vol = inpObj.vcvx.vol;
        var chp = inpObj.vcvx.chp;
        var vrs = inpObj.vcvx.vrs;
        var txt = inpObj.vcvx.txt;
        var ret = BibleUti.load_BibleObj(fil);//"_notes");
        ret.obj[vol][chp][vrs] = txt;
        var sss = JSON.stringify(ret.obj, null, 4);
        //fs.writeFileSync(ret.fname, sss, "utf8");
        ret.writeback();
        return sss;
    },
    Jsonpster: function (req, res) {
        ////////////////////////////////////////////
        //app.get("/Jsonpster", (req, res) => {
        console.log();
        console.log("res.req.headers.host=", res.req.headers.host);

        //////////////
        var RestApi = {}
        Object.keys(this).forEach(function (key) {
            RestApi[key] = key;
        })
        var jstr_RestApi = JSON.stringify(RestApi);
        var s = `
var Jsonpster = {
    inp:null,
    api:null,
Url: function (){
        this.m_src = 'http://${res.req.headers.host}/'+this.api+'?inp='+encodeURIComponent(JSON.stringify(this.inp));
        return this.m_src;
    },
Run : function (cbf) {
    if (!cbf) alert('callback Response null');
    if (!this.api) alert('api=null');
    if (!this.inp) alert('inp=null');
    this.Response = cbf;
    var s = document.createElement('script');
    s.src = this.Url()
    document.body.appendChild(s);
    console.log('Jsonpster:',this.s, Jsonpster);
    this.api = this.inp = null;
}};
const RestApi = JSON.parse('${jstr_RestApi}');
`;;;;;;;;;;;;;;

        console.log(s);
        res.send(s);
        res.end();
        //});
    },
    ApiBibleObj_load_Bkns_Vols_Chp_Vrs: function (req, res) {
        var inpObj = BibleUti.GetApiInputParamObj(req)
        var RbcObj = {};
        if ("object" === typeof inpObj.fnames) {//['NIV','ESV']
            for (var i = 0; i < inpObj.fnames.length; i++) {
                var fnm = inpObj.fnames[i];
                if ("_" === fnm[0]) {
                    fnm = BibleUti.get_usr_pathfile(inpObj.username, inpObj.fnames[i])
                }
                var bib = BibleUti.load_BibleObj(fnm);//.fname, inpObj.dat
                if (!bib.size <= 0) {


                }
                var bcObj = BibleUti.get_bc(bib.obj, inpObj.bibOj);
                RbcObj[fnm] = bcObj;
            }
        }
        var bcvR = {}
        BibleUti.convert_rbcv_2_bcvR(RbcObj, bcvR)
        var ss = JSON.stringify(bcvR);

        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
    },
    ApiBibleObj_search_txt: function (req, res) {
        var inpObj = BibleUti.GetApiInputParamObj(req)
        var RbcObj = {};
        if ("object" === typeof inpObj.fnames) {//['NIV','ESV']
            for (var i = 0; i < inpObj.fnames.length; i++) {
                var fnm = inpObj.fnames[i];
                var bib = BibleUti.load_BibleObj(fnm);//.fname, inpObj.dat
                RbcObj[fnm] = bib.obj;
            }
        }
        var bcvR = {}
        BibleUti.convert_rbcv_2_bcvR(RbcObj, bcvR)
        var bcvR2 = BibleUti.search_str_in_bcvR(bcvR, inpObj.Search.File, inpObj.Search.Strn);

        var ss = JSON.stringify(bcvR2);

        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
    },
    ApiBibleObj_write_UsrFileBkcChpVrs: function (req, res) {
        var inpObj = BibleUti.GetApiInputParamObj(req)
        inpObj.response_status = "WriteBegin"
        var RbcObj = {};
        if ("object" === typeof inpObj.fnames) {//['NIV','ESV']
            var fnm = BibleUti.get_usr_pathfile(inpObj.username, inpObj.fnames[0])
            if (fnm) {
                for (const [bkc, bkcObj] of Object.entries(inpObj.inpObj)) {
                    for (const [chp, chpObj] of Object.entries(bkcObj)) {
                        for (const [vrs, txt] of Object.entries(chpObj)) {
                            var bib = BibleUti.load_BibleObj(fnm);//.fname, inpObj.dat
                            bib.obj[bkc][chp][vrs] = txt
                            bib.writeback();
                            inpObj.response_status += ":Success"
                        }
                    }
                }
            }
        }
        var ss = JSON.stringify(inpObj)
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
    },
    ApiBibleObj_access_regex_search_history: function (req, res) {
        var inpObj = BibleUti.GetApiInputParamObj(req)
        console.log("ApiBibleObj_access_regex_search_history inpObj", inpObj);
        var sret = JSON.stringify(inpObj);
        if (!inpObj || !inpObj.Search || !inpObj.Search.File || 0 === inpObj.Search.File.length) {
            console.log("return null.");
            return sret;
        }
        var fname = inpObj.Search.File;//
        if (undefined === BibleUti.ValideBibleObjFiles[fname]) {
            console.log("Invalide Filename to save ************* inpObj", inpObj);
            console.log("ValideBibleObjFiles=", ValideBibleObjFile);
            return sret;
        }

        var ret = BibleUti.load_BibleObj(fname);
        if (!inpObj.Search.Strn) {//only read no write.
            console.log("only read no write...fname=", fname);
            return ret.jstrn;
        }
        var srchstr = inpObj.Search.Strn;
        if (srchstr.length > 0) {//write to history.
            ret.obj["Gen"]["1"]["1"][srchstr] = Uti.getDateTime();
            ret.writeback();
            console.log("saved str=" + srchstr, " in file=", fname);
            return sret;
        }
        console.log("ret=", ret);
        ss = JSON.stringify(RbcObj);
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write("Jsonpster.Response(" + ss + ");");
        res.end();
        return ret;
    },
}//// BibleRestApi ////

var BibleObjJsonpApi = {
    init: function (app) {
        Object.keys(ApiJsonp_BibleObj).forEach(function (sapi) {
            console.log("api:", sapi)
            app.get("/" + sapi, function (req, res) {
                ApiJsonp_BibleObj[sapi](req, res);
            })
        });
        return;
    }
}




module.exports = {
    BibleObjJsonpApi: BibleObjJsonpApi
}

