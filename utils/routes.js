import express from "express";
let app=express()
import {listFiles,downloadFile,getFilePath, uploadFile} from "./drive.js"
import dotenv from "dotenv"
dotenv.config()
import {encrypt,decrypt, base64ToArrayBuffer} from "./encryption.js"
let {AES_KEY} = process.env
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
    
    app.listen(3000,()=>{
      console.log("server is running")
    })
}

export {startWebServer};