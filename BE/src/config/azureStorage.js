const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

let blobServiceClient;
let containerClient;

const initAzureStorage = async () => {
  try {
    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob'
    });

    console.log('✅ Azure Blob Storage connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Azure Storage initialization error:', error.message);
    return false;
  }
};

const uploadFileToBlob = async (fileName, fileBuffer, mimeType) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    };

    await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Upload to Azure Blob error:', error);
    throw new Error('Failed to upload file to Azure Storage');
  }
};

const deleteFileFromBlob = async (fileName) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.deleteIfExists();
    return true;
  } catch (error) {
    console.error('Delete from Azure Blob error:', error);
    throw new Error('Failed to delete file from Azure Storage');
  }
};

const getFileUrl = (fileName) => {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  return blockBlobClient.url;
};

module.exports = {
  initAzureStorage,
  uploadFileToBlob,
  deleteFileFromBlob,
  getFileUrl,
  containerClient
};
