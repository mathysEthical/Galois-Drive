import express from "express";
const PORT = process.env.PORT || 3000;
let app=express()
import {listFiles,downloadFile,getFilePath, uploadFile, setCredentials, isDriveSet, deleteFile} from "./drive.js"
import dotenv from "dotenv"
dotenv.config()
import {encrypt,decrypt, base64ToArrayBuffer} from "./encryption.js"
let {AES_KEY, REDIRECT_URI, CLIENT_ID} = process.env
// old version
// const bodyParser = require('body-parser');

// new version
import multer from "multer"
const upload = multer()

function startWebServer(){
    app.get("*",(req,res,next)=>{
      if(!isDriveSet() && req.path!="/login" && req.path!="/setCredentials"){
        res.redirect("/login")
      }else{
        next()
      }
    })
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"))


    app.delete("/api/delete/:id",async (req,res)=>{
      await deleteFile(req.params.id)
      res.json({message:"file deleted"})
    })

    app.get("/api/list/:id",async (req,res)=>{
      let jsonRes={files: [], path: "/"}
      if(isDriveSet()){
        let fileId=req.params.id
        if(fileId=="root"){
          fileId=process.env.SECURE_FOLDER_ID
        }
        let path=await getFilePath(fileId)
        console.log("path:", path)
        let filesList=(await listFiles(fileId)).files
        filesList.forEach(file => {
          file.name=decrypt(AES_KEY,Buffer.from(file.name,"base64"))
        });
        jsonRes={files: filesList, path: path}
      }
        res.json(jsonRes)
    })
    
    app.get("/api/download/:id",async (req,res)=>{
      let fileId=req.params.id
      let fileData=await downloadFile(fileId)
      res.send(fileData)
    })

    app.get("/login",(req,res)=>{
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=${encodeURI(REDIRECT_URI)}&prompt=consent&response_type=code&client_id=${encodeURI(CLIENT_ID)}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&access_type=offline&service=lso&o2v=2&ddm=1&flowName=GeneralOAuthFlow`)
    })

    app.get("/setCredentials",(req,res)=>{
      let code=req.query.code
      setCredentials(code)
      setTimeout(() => {
        res.redirect("/")
      }, 2000);
    })

    app.post("/api/upload/:id",upload.any(),async (req,res)=>{
      let fileId=req.params.id
      let fileName=req.body.fileName
      let fileData=req.files[0].buffer
      let size=fileData.length
      console.log(fileData)
      console.log(size)
      
      let rawData=fileData
      try {
        const file = uploadFile(rawData,fileName,fileId)
        res.json(file)
      } catch (error) {
        res.json({error:error.message})
      }
    })
    
    
    app.listen(PORT,()=>{
      console.log("server is running on port "+PORT)
    })
}

export {startWebServer};