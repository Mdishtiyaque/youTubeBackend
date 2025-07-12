import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null

      const response=await  cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
      //  console.log("response")
       //   console.log(typeof  response)
      //  console.log("file is uplaoded on cloudinary",response.url)
       //  fs.unlinkSync(localFilePath)    
        
            fs.unlinkSync(localFilePath);
        

       return response;
    }catch(error){
     fs.unlinkSync(localFilePath) //remove the locally saved temporary file as operation upload is failed

    }
}

const deleteImageFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Get filename from the URL
    const parts = imageUrl.split('/');
    const fileWithExtension = parts[parts.length - 1]; // fxru4g34ackrsvulhswq.jpg
    const publicId = fileWithExtension.split('.')[0];  // fxru4g34ackrsvulhswq

    // Delete from Cloudinary root folder
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
  }
};
  
export {uploadOnCloudinary,deleteImageFromCloudinary}