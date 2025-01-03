
import registerModel from "#wms/ModuleRegister/registerModel";
// import { BlobServiceClient } from '@azure/storage-blob';
import { HelperFunctionController as helper } from "#wms/Helper/function";
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import  otpGenerator  from 'otp-generator'
const USRMST00 = await helper.CreateDynamicModel("user_master")||registerModel.getModel("user_master");

import { Op, Sequelize } from "sequelize";

import multer from "multer";

 // Use memory storage for handling file buffers


 const upload = multer({ storage: multer.memoryStorage() });


class UploadController  {
  constructor() { }

  
 
  
  
 
    // static uploadFile = async (req, res) => {
    //   // Initialize multer for memory storage inside the static method
    //   const upload = multer({ storage: multer.memoryStorage() });
  
    //   // Use the upload middleware to handle file uploads
    //   upload.array('files', 10)(req, res, async (err) => {
    //     let response = {
    //       status: false,
    //       message: "Unprocessable Entry",
    //       data: {},
    //       statusCode: 422,
    //     };
  
    //     // Handle multer error
    //     if (err) {
    //       console.error("Multer error:", err);
    //       return res.status(400).json({ message: 'Error in file upload', error: err.message });
    //     }
  
    //     try {
    //       console.log('Files:', req.files);
    //       const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    //       const containerName = 'newtrial0608'; // Replace with your container name
  
    //       if (!AZURE_STORAGE_CONNECTION_STRING) {
    //         return res.status(500).send('Azure Storage connection string not configured.');
    //       }
  
    //       const files = req.files; // Files will be available in req.files
    //       if (!files || files.length === 0) {
    //         return res.status(400).send('No files provided for upload.');
    //       }
  
    //       const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    //       const containerClient = blobServiceClient.getContainerClient(containerName);
  
    //       await containerClient.createIfNotExists();
  
    //       const uploadResults = [];
    //       for (const file of files) {
    //         const blobName = `${Date.now()}-${file.originalname || 'uploaded-file'}`;
    //         const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
    //         await blockBlobClient.uploadData(file.buffer, {
    //           blobHTTPHeaders: { blobContentType: file.mimetype || 'application/octet-stream' },
    //         });
  
    //         uploadResults.push({
    //           blobName,
    //           url: blockBlobClient.url,
    //         });
    //       }
  
    //       response.data = uploadResults;
    //       response.status = true;
    //       response.message = "Files uploaded successfully.";
    //       response.statusCode = 200;
  
    //       return res.status(200).json(response);
    //     } catch (error) {
    //       console.error("Error uploading files:", error);
  
    //       response.message = error.message || response.message;
    //       response.statusCode = error.statusCode || response.statusCode;
  
    //       return res.status(response.statusCode).json(response);
    //     }
    //   });
    // };
  
   

    static uploadFile = async (req, res) => {
      // Initialize multer for memory storage inside the static method
      const upload = multer({ storage: multer.memoryStorage() });
    
      // Use the upload middleware to handle file uploads
      upload.array('files', 10)(req, res, async (err) => {
        let response = {
          status: false,
          message: "Unprocessable Entry",
          data: {},
          statusCode: 422,
        };
    
        // Handle multer error
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({ message: 'Error in file upload', error: err.message });
        }
    
        try {
          console.log('Files:', req.files);
          const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
          const containerName = 'newtrial0608'; // Replace with your container name
    
          if (!AZURE_STORAGE_CONNECTION_STRING) {
            return res.status(500).send('Azure Storage connection string not configured.');
          }
    
          const files = req.files; // Files will be available in req.files
          if (!files || files.length === 0) {
            return res.status(400).send('No files provided for upload.');
          }
    
          const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
          const containerClient = blobServiceClient.getContainerClient(containerName);
    
          await containerClient.createIfNotExists();
    
          const uploadResults = [];
          for (const file of files) {
            const blobName = `${Date.now()}-${file.originalname || 'uploaded-file'}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
            // Upload file to Azure Blob Storage
            await blockBlobClient.uploadData(file.buffer, {
              blobHTTPHeaders: { blobContentType: file.mimetype || 'application/octet-stream' },
            });
    
            // Generate SAS URL for the uploaded blob
            const expiresOn = new Date();
            expiresOn.setHours(expiresOn.getHours() + 1); // Set SAS URL expiration to 1 hour
    
            const sasToken = generateBlobSASQueryParameters({
              containerName: containerClient.containerName,
              blobName,
              permissions: BlobSASPermissions.parse("r"), // Read-only permissions
              expiresOn,
            }, blobServiceClient.credential).toString();
    
            const sasUrl = `${blockBlobClient.url}?${sasToken}`;
    
            uploadResults.push({
              blobName,
              url: sasUrl,
            });
          }
    
          response.data = uploadResults;
          response.status = true;
          response.message = "Files uploaded successfully.";
          response.statusCode = 200;
    
          return res.status(200).json(response);
        } catch (error) {
          console.error("Error uploading files:", error);
    
          response.message = error.message || response.message;
          response.statusCode = error.statusCode || response.statusCode;
    
          return res.status(response.statusCode).json(response);
        }
      });
    };
    
  }
  
  

 

 

  



export default UploadController;
