import express from "express";
const PORT = process.env.PORT || 3000;
let app=express()
import {listFiles,downloadFile,getFilePath, uploadFile, setCredentials} from "./drive.js"
import dotenv from "dotenv"
dotenv.config()
import {encrypt,decrypt, base64ToArrayBuffer} from "./encryption.js"
let {AES_KEY, REDIRECT_URI, CLIENT_ID} = process.env
import "body-parser"


function startWebServer(){
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"))

    app.get("/api/list/:id",async (req,res)=>{
      let fileId=req.params.id
      if(fileId=="root"){
        fileId=process.env.SECURE_FOLDER_ID
      }
      let path=await getFilePath(fileId)
      console.log(path)
      let filesList=(await listFiles(fileId)).files
      filesList.forEach(file => {
        file.name=decrypt(AES_KEY,file.name)
      });
      let jsonRes={files: filesList, path: path}
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
      res.redirect("/")
    })

    app.post("/api/upload/:id",async (req,res)=>{
      console.log(req.body)
      let fileId=req.params.id
      let fileName=req.body.fileName
      let fileData=req.body.file
      let rawData=Buffer.from(base64ToArrayBuffer(fileData))
      try {
        const file = uploadFile(rawData,fileName,fileId)
        res.json(file)
      } catch (error) {
        res.json({error:error.message})
      }
    })
    
    app.get("/",(req,res)=>{
      res.send("Hello")
    })
    
    app.listen(PORT,()=>{
      console.log("server is running on port "+PORT)
    })
}

export {startWebServer};