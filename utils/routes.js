import express from "express";
let app=express()
import {listFiles,downloadFile,getFilePath} from "./drive.js"
import dotenv from "dotenv"
dotenv.config()
import {encrypt,decrypt} from "./encryption.js"
let {AES_KEY} = process.env

function startWebServer(){

    app.use(express.static("public"))

    app.get("/api/list/:id",async (req,res)=>{
      let fileId=req.params.id
      if(fileId=="root"){
        fileId=process.env.SECURE_FOLDER_ID
      }
      let path=await getFilePath(fileId)
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
    
    app.get("/",(req,res)=>{
      res.send("Hello")
    })
    
    app.listen(3000,()=>{
      console.log("server is running")
    })
}

export {startWebServer};