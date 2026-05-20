import { config, credentials, region } from './config.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";


async function addRestriccion(p_id_restriccion, p_id_usuario, p_nom_restriccion, p_estado) {
 
    const params = {
      TableName: config.dynamo.restricciones,
      Item: {
        id_restriccion: p_id_restriccion,
        id_usuario: p_id_usuario,
        nom_restriccion: p_nom_restriccion,
        estado: p_estado
      }
    };     
    
    return await addTable(params);
  };

   export async function queryRestriccion(p_id_usuario, p_nom_restriccion) {
    
    const params = {
        TableName: config.dynamo.restricciones,
        FilterExpression: "id_usuario = :id_usuario AND nom_restriccion = :nom_restriccion AND estado = :estado", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":nom_restriccion": p_nom_restriccion,
          ":estado": "Vigente"
        }
      }
    
    return await queryTable(params);
  };

  async function queryRestricciones(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.restricciones,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Vigente"
        },
      };

    return await queryTable(params);
}

export async function updateRestriccion(p_id_usuario, p_nom_restriccion) {
    
  const query = await queryRestriccion(p_id_usuario, p_nom_restriccion);  
  console.log('updateRestriccion query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_restriccion = query.Items[0].id_restriccion;
    console.log('updateRestriccion id_restriccion=' + id_restriccion);
    const params = {
      TableName: config.dynamo.restricciones,
      Key: { id_restriccion: id_restriccion, id_usuario: p_id_usuario },
      UpdateExpression: "set estado = :estado",
      ConditionExpression: "nom_restriccion = :nom_restriccion",
      ExpressionAttributeValues: {
        ":nom_restriccion": p_nom_restriccion,
        ":estado": "Finalizada"
      },
    };

    return updateTable(params);
  }
  return null;    
}

async function ConsultarRestriccionesIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await queryRestricciones(id_usuario);
  console.log('ConsultarRestriccionesIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' restricciones vigentes.\n';

  if (query.Count > 0) {
    speakOutput = speakOutput + 'Se detallan a continuación:\n';

    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + (i + 1) + '. ' + query.Items[i].nom_restriccion + '.\n';
    }
    speakOutput = speakOutput + '\nPara finalizar una restricción, di, por ejemplo, He finalizado la restricción ' + query.Items[0].nom_restriccion + '.';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddRestriccionIntent (handlerInput) { 

  let speakOutput = '';
  console.log('Entra a AddRestriccionIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  
  const nom_restriccion = slots.nom_restriccion.value;
  console.log('nom_restriccion=' + nom_restriccion);

  if (nom_restriccion === undefined) {
    speakOutput = 'Por favor, dime la restricción, por ejemplo, agrega restricción alergia a la lactosa.';
  }
  else{
    try{
      const id_usuario = handlerInput.requestEnvelope.session.user.userId;

      let query = await queryRestriccion(id_usuario, nom_restriccion);  
      console.log('queryRestriccion query=' + JSON.stringify(query));
      if (query.Count > 0) {  
        speakOutput = 'Ya existe una restricción ' + nom_restriccion + ' vigente.';
      }
      else{

        const id_restriccion = new Date().getTime();
        console.log('id_restriccion=' + id_restriccion);
        
        query = await addRestriccion(id_restriccion, id_usuario, nom_restriccion, 'Vigente');
        speakOutput = 'Restricción ' + nom_restriccion + ' registrada correctamente.';
        speakOutput = speakOutput + '\nPara finalizarla, di, he finalizado la restricción ' + nom_restriccion + '.';
        speakOutput = speakOutput + '\nPara consultar las restricciones vigentes, di, consulta restricciones.';
      }
    }
    catch(err){
      speakOutput = 'Por favor, dime un nombre de restricción valido, por ejemplo, agrega restricción de ' + nom_restriccion + '.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

async function UpdateRestriccionIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  const nom_restriccion = slots.nom_restriccion.value;
  let query = await queryRestriccion(id_usuario, nom_restriccion);

  console.log('UpdateRestriccionIntent query=' + JSON.stringify(query));

  let speakOutput = '';

  if (query.Count === 0) {
    speakOutput = speakOutput + 'No existe la restricción de ' + nom_restriccion + '.';
  }
  else{
    query = await updateRestriccion(id_usuario, nom_restriccion);
    speakOutput = speakOutput + 'La restricción de ' + nom_restriccion + ' ha sido actualizada a finalizada. ';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

export const RestriccionesHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddRestriccionIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'ConsultarRestriccionesIntent'||
                handlerInput.requestEnvelope.request.intent.name === 'UpdateRestriccionIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddRestriccionIntent'){
        return await AddRestriccionIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarRestriccionesIntent'){
        return await ConsultarRestriccionesIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'UpdateRestriccionIntent'){
        return await UpdateRestriccionIntent(handlerInput);
      }
    }      
};