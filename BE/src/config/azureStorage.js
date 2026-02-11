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

    if (!containerName) {
      throw new Error('Azure Storage container name not configured');
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if it doesn't exist
    const createResponse = await containerClient.createIfNotExists({
      access: 'blob'
    });

    if (createResponse.succeeded) {
      console.log(`✅ Azure Blob Storage container '${containerName}' created successfully`);
    } else {
      console.log(`✅ Azure Blob Storage container '${containerName}' already exists`);
    }

    // Verify container exists
    const exists = await containerClient.exists();
    if (!exists) {
      throw new Error(`Container '${containerName}' does not exist and could not be created`);
    }

    console.log('✅ Azure Blob Storage connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Azure Storage initialization error:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

const uploadFileToBlob = async (fileName, fileBuffer, mimeType) => {
  try {
    if (!containerClient) {
      throw new Error('Azure Storage not initialized. Please restart the server.');
    }

    // Ensure container exists before upload
    const exists = await containerClient.exists();
    if (!exists) {
      console.log('Container does not exist, attempting to create...');
      await containerClient.createIfNotExists({
        access: 'blob'
      });
    }

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
    if (error.statusCode === 404) {
      throw new Error(`Container '${containerName}' not found. Please check Azure Storage configuration.`);
    }
    throw new Error(`Failed to upload file to Azure Storage: ${error.message}`);
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
