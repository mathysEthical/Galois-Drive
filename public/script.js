let currentDir="root"
let filesDiv=document.getElementById("files")
let pathDiv=document.getElementById("path")
let queryParams = new URLSearchParams(window.location.search);
let loadingBar=document.getElementById("loading")
let parent="root"
let isLoading=false;
if(queryParams.get("d")!=null){
    currentDir=queryParams.get("d")
}
let debugData;

function exploreParent(){
    explore(parent)
}

function loadingBarAnimation(progress){
    loadingBar.style.width=`${Math.round((1-Math.exp(-progress))*100)}%`
    setTimeout(()=>{
        if(isLoading){
            progress+=1;
            loadingBarAnimation(progress)
        }else{
            loadingBar.style.width=`100%`
            loadingBar.style.display="none"
        }
    },300)
}

function endLoading(){
    isLoading=false;
}

function startLoading(){
    loadingBar.style.display="block"
    loadingBar.style.width="0%"
    isLoading=true;
    let progress=0;
    loadingBarAnimation(progress);
}


async function list(folderID){
    let req=await fetch("/api/list/"+folderID)
    let res=await req.json()
    parent=res.parentFolderId
    return res
}

async function folderCreation(){
    let folderName = prompt("Please enter folder name:", "New Folder");
    createFolder(folderName, currentDir)
}

async function createFolder(folderName, parentFolderId){
    let req=await fetch("/api/createFolder/"+parentFolderId, {
        method: "POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            folderName: folderName
        })
    })
    let res=await req.json()
    explore(currentDir)
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

async function deleteFile(fileID){
    let req=await fetch("/api/delete/"+fileID, {
        method: "DELETE"
    })
    let res=await req.json()
    explore(currentDir)
}

async function explore(fileID){
    startLoading();
    currentDir=fileID
    window.history.pushState("","","/?d="+currentDir)
    let filesHTML=""
    let res=await list(currentDir)
    fileList=res.files
    let {path}=res
    fileList.forEach((file)=>{
        let icon="file"
        let onclickHTMLdelete=`deleteFile('${file.id}')`
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
            <div class="delete" onclick="${onclickHTMLdelete}">x</div>
        </div>`
    })
    filesDiv.innerHTML=filesHTML
    pathDiv.innerHTML=path
    endLoading()
}

function arrayBufferToB64(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const CHUNK_SIZE = 0x8000; // 32KB per chunk
    let b64 = '';

    for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
        const chunk = u8.subarray(i, i + CHUNK_SIZE);
        b64 += String.fromCharCode(...chunk);
    }

    return btoa(b64);
}


async function uploadFile(data,fileName){
    debugData=data

    // // json version
    // let req=await fetch("/api/upload/"+currentDir,{
    //     method:"POST",
    //     headers:{
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         fileName: fileName,
    //         file: arrayBufferToB64(data)
    //     })
    // })
    // let res=await req.json()
    // console.log(res)

    // form version
    let formData=new FormData()
    formData.append("fileName",fileName)
    formData.append("file",new Blob([data]))
    let req=await fetch("/api/upload/"+currentDir,{
        method:"POST",
        body: formData
    })
    let res=await req.json()
    console.log(res)

}

var drop;
addEventHandler(window, 'load', function () {
    drop = document.getElementById('drop1');

    function cancel(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        return false;
    }

    addEventHandler(drop, 'dragover', function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        return false;
    });
    addEventHandler(drop, 'dragleave', function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        return false;
    });
    
    addEventHandler(drop, 'dragenter', cancel);


    addEventHandler(drop, 'drop', function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        } // stops the browser from redirecting off to the image.

        var dt = e.dataTransfer;
        var files = dt.files;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var reader = new FileReader();

            reader.readAsArrayBuffer(file)
            addEventHandler(reader, 'loadend', function (e, file) {
                var bin = this.result;
                console.log("data:",bin)
                uploadFile(bin,file.name)
            }.bindToEventHandler(file));
        }
        return false;
    });

    Function.prototype.bindToEventHandler = function bindToEventHandler() {
        var handler = this;
        var boundParameters = Array.prototype.slice.call(arguments);
        //create closure
        return function (e) {
            boundParameters.unshift(e);
            handler.apply(this, boundParameters);
        }
    };
});

//seperate event
function addEventHandler(obj, evt, handler) {
    if (obj.addEventListener) {
        obj.addEventListener(evt, handler, false);
    } else if (obj.attachEvent) {
        obj.attachEvent('on' + evt, handler);
    } else {
        obj['on' + evt] = handler;
    }
}

async function start(){
    explore(currentDir)
}

start()