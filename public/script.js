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

function arrayBufferToB64(arrayBuffer){
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
}


async function uploadFile(data,fileName){
    let req=await fetch("/api/upload/"+currentDir,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            fileName: fileName,
            file: arrayBufferToB64(data)
        })
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