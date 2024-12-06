let currentDir="root"
let filesDiv=document.getElementById("files")
let pathDiv=document.getElementById("path")

async function list(folderID){
    let req=await fetch("/api/list/"+folderID)
    let res=await req.json()
    return res
}

async function downloadFile(fileID,fileName){
    let req=await fetch("/api/download/"+fileID)
    let res=await req.blob()
    let url=URL.createObjectURL(res)
    let a=document.createElement("a")
    a.href=url
    a.download=fileName
    a.click()
}

async function explore(fileID){
    currentDir=fileID
    let filesHTML=""
    let res=await list(currentDir)
    fileList=res.files
    let {path}=res
    fileList.forEach((file)=>{
        let icon="file"
        let onclickHTML=`downloadFile('${file.id}','${file.name}')`
        if(file.mimeType=="application/vnd.google-apps.folder"){
            icon="folder"
            onclickHTML=`explore('${file.id}')`
        }
        filesHTML+=`<div class="file" ondblclick="${onclickHTML}">
            <div class="icon">
                <img src="/img/${icon}.svg">
            </div>
            <div class="name">${file.name}</div>
        </div>`
    })
    filesDiv.innerHTML=filesHTML
    pathDiv.innerHTML=path
}

async function start(){
    explore(currentDir)
}

start()
