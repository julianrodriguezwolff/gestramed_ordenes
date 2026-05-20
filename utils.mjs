import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, UpdateCommand  } from "@aws-sdk/lib-dynamodb";
import { config, credentials, region } from './config.mjs'; 

export async function addTable(p_params) {    
    
    try{
        const client = new DynamoDBClient(region);
        const docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true, // Optional: auto-remove undefined properties
        },
        });
        return await docClient.send(new PutCommand(p_params));
        return response;
    }
    catch (err) {
        console.error("Error:", err);
    }
  };

export async function queryTable(p_params) {   

    try{
        const client = new DynamoDBClient(region);
        const docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true, // Optional: auto-remove undefined properties
        },
        });
        return await docClient.send(new ScanCommand(p_params));
        return response;
    }
    catch (err) {
        console.error("Error:", err);
    }
}  

export async function updateTable(p_params) {   

    try{
        const client = new DynamoDBClient(region);
        const docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true, // Optional: auto-remove undefined properties
        },
        });
        return await docClient.send(new UpdateCommand(p_params));
        return response;
    }
    catch (err) {
        console.error("Error:", err);
    }
} 