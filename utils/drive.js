
import { google } from 'googleapis';
import dotenv from "dotenv"
dotenv.config()
import { encrypt, decrypt, base64ToArrayBuffer } from "./encryption.js"
const { SECURE_FOLDER_ID, AES_KEY, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

let drive = "unset";

function setCredentials(code) {
  //get refresh token from access code
  oauth2Client.getToken(code, (err, token) => {
    try {
      // use refresh token to get access token
      oauth2Client.setCredentials({ refresh_token: token.refresh_token });
      
      drive = google.drive({
        version: 'v3',
        auth: oauth2Client,
      });
    } catch (error) {
      console.log("error:",error.message)
    }
  });
  


}

/**
 * 
 * @param {string} data 
 * @param {string} fileName 
 * @param {string} parentFolderId 
 * @returns {string} fileId
 */
async function uploadFile(data, fileName, parentFolderId = SECURE_FOLDER_ID) {
  if (parentFolderId == "root") {
    parentFolderId = SECURE_FOLDER_ID

  }
  try {
    let response = await drive.files.create({
      requestBody: {
        name: encrypt(AES_KEY, fileName),
        parents: [parentFolderId],
      },
      media: {
        body: encrypt(AES_KEY, data),
      },
    });

    return response.data.id;
  } catch (error) {
    console.log(error.message);
  }
}

/**
 * 
 * @param {string} folderName 
 * @param {string} parentFolderId 
 * @returns {string} folderId
 */
async function createFolder(folderName, parentFolderId = SECURE_FOLDER_ID) {
  const fileMetadata = {
    name: encrypt(AES_KEY, folderName),
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId]
  };
  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    });
    console.log('Folder Id:', file.data.id);
    return file.data.id;
  } catch (err) {
    throw err;
  }
}

async function getFile(fileId) {
  try {
    const response = await drive.files.get({ fileId, fields: "*" });

    return response.data;
  } catch (error) {
    console.log(error.message);
  }
}


/**
 * 
 * @param {string} fileID 
 * @returns {number} status
 */
async function deleteFile(fileID) {
  try {
    const response = await drive.files.delete({
      fileId: fileID,
    });
    return response.status;
  } catch (error) {
    console.log(error.message);
  }
}

// deleteFile();

async function generatePublicUrl(fileId) {
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    /* 
    webViewLink: View the file in browser
    webContentLink: Direct download link 
    */
    const result = await drive.files.get({
      fileId: fileId,
      fields: 'webContentLink',
    });
    console.log(result.data);
  } catch (error) {
    console.log(error.message);
  }
}


/**
 * 
 * @param {string} fileId 
 * @param {string} actualPath 
 * @returns {string} path
 */
async function getFilePath(fileId, actualPath) {
  if(drive=="unset"){
    console.log("Drive not set")
  }else{
  if (typeof actualPath == "undefined") {
    actualPath = "/"
  }
  if (fileId != SECURE_FOLDER_ID) {
    let file = await getFile(fileId)
    let { name } = file

    if (typeof file.parents == "undefined") {
      return actualPath
    }
    fileId = file.parents[0]
    actualPath = `/${decrypt(AES_KEY, name)}${actualPath}`
    // console.log(fileId)
    return await getFilePath(fileId, actualPath)
  } else {
    return actualPath
  }
}
}


async function downloadFile(fileId) {
  try {
    const response = await drive.files.get({ fileId, alt: "media", fields: "*" });
    return decrypt(AES_KEY, response.data)
  } catch (error) {
    console.log(error.message);
  }
}


async function listFiles(parentID = SECURE_FOLDER_ID) {
  if(drive=="unset"){
    console.log("Drive not set")
    return {files:[]}
  }else{
    try {
      //id,name,quotaBytesUsed,mimeType
      const response = await drive.files.list({ fields: 'files(*)', q: `'${parentID}' in parents` });
      return response.data;
    } catch (error) {
      console.log("error", error)
      return error.message;
    }
  }
}

export { listFiles, downloadFile, getFilePath, createFolder, uploadFile, setCredentials };