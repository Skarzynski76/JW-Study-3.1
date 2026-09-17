'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
(async()=>{
 const factory=require(path.join(root,'lib/smart-import/tesseract-core-lstm.wasm.js')),core=await factory({});
 core.FS.writeFile('/pol.traineddata',require('node:zlib').gunzipSync(fs.readFileSync(path.join(root,'lib/smart-import/lang/pol.traineddata.gz'))));
 const api=new core.TessBaseAPI();
 try{
  assert.equal(api.Init(null,'pol',1),0);
  core.FS.writeFile('/input',new Uint8Array(fs.readFileSync(path.join(__dirname,'fixtures/ocr.png'))));
  api.SetImageFile(1,0);api.SetPageSegMode(6);api.Recognize(null);
  const text=api.GetUTF8Text().trim();assert.equal(text,'Jehowa jest moim Pasterzem.');
  fs.writeSync(1,text+'\n');
 }finally{api.End();core.destroy(api);}
})().catch(e=>{console.error(e);process.exitCode=1;});
