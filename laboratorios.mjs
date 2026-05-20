import { config, credentials, region } from './config.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";


async function addLaboratorio(p_id_laboratorio, p_id_usuario, p_tipo_laboratorio, p_nom_laboratorio, p_estado) {
 
    const params = {
      TableName: config.dynamo.laboratorios,
      Item: {
        id_laboratorio: p_id_laboratorio,
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        tipo_laboratorio: p_tipo_laboratorio,
        nom_laboratorio: p_nom_laboratorio,
        estado: p_estado
      }
    };     
    
    return await addTable(params);
  };

   export async function queryLaboratorio(p_id_usuario, p_tipo_laboratorio, p_nom_laboratorio) {
    
    const params = {
        TableName: config.dynamo.laboratorios,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado AND tipo_laboratorio = :tipo_laboratorio AND nom_laboratorio = :nom_laboratorio", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
          ":tipo_laboratorio": p_tipo_laboratorio,
          ":nom_laboratorio": p_nom_laboratorio
        },
      };

    return queryTable(params);
}

  async function queryLaboratorios(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.laboratorios,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado ", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
        },
      };

    return queryTable(params);
}

export async function updateLaboratorio(p_id_usuario, p_tipo_laboratorio, p_nom_laboratorio) {
    
  const query = await queryLaboratorio(p_id_usuario, p_tipo_laboratorio, p_nom_laboratorio);  
  console.log('updateLaboratorio query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_laboratorio = query.Items[0].id_laboratorio;
    console.log('updateLaboratorio id_laboratorio=' + id_laboratorio);
    const params = {
      TableName: config.dynamo.laboratorios,
      Key: { id_laboratorio: id_laboratorio, id_usuario: p_id_usuario },
      UpdateExpression: "set estado = :estado",
      ConditionExpression: "nom_laboratorio = :nom_laboratorio AND tipo_laboratorio = :tipo_laboratorio",
      ExpressionAttributeValues: {
        ":nom_laboratorio": p_nom_laboratorio,
        ":tipo_laboratorio": p_tipo_laboratorio,
        ":estado": 'Tomado'
      },
    };

    return updateTable(params);
  }
  return null;    
}

async function ConsultarLaboratoriosIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await queryLaboratorios(id_usuario);
  console.log('ConsultarLaboratoriosIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' laboratorios e imágenes diagnósticas pendientes.\n';

  if (query.Count > 0) {

    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + (i + 1) + '. ' + query.Items[i].tipo_laboratorio + ' de ' + query.Items[i].nom_laboratorio + '.\n';
    }
    speakOutput = speakOutput + 'Para registrar como tomado algún laboratorio o imagen diagnóstica, di, por ejemplo, he tomado ' + query.Items[0].tipo_laboratorio + ' de ' + query.Items[0].nom_laboratorio + '.';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddLaboratoriosIntent (handlerInput, p_tipo_laboratorio) { 

  let speakOutput = '';
  console.log('Entra a AddLaboratoriosIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  const laboratorio = slots.nom_laboratorio.value;
  console.log('laboratorio=' + laboratorio);

  if (laboratorio === undefined) {
    speakOutput = 'Por favor, dime el nombre del laboratorio, por ejemplo, agrega laboratorio de creatinina.';
  }
  else{
    try{
      const id_usuario = handlerInput.requestEnvelope.session.user.userId;

      let query = await queryLaboratorio(id_usuario, p_tipo_laboratorio,laboratorio);  
      console.log('queryLaboratorio query=' + JSON.stringify(query));
      console.log('queryLaboratorio query.Count=' + query.Count);
      if (query.Count > 0) {  
        speakOutput = 'Ya existe ' + p_tipo_laboratorio + ' de ' + laboratorio + ' pendiente';
      }
      else{

        const id_laboratorio = new Date().getTime();
        console.log('id_laboratorio=' + id_laboratorio);
        
        query = await addLaboratorio(id_laboratorio, id_usuario, p_tipo_laboratorio, laboratorio, 'Pendiente');
        speakOutput = p_tipo_laboratorio + ' de ' + laboratorio + ' registrado correctamente.';
        
        speakOutput = speakOutput + '\nPara tomarlo, di, he tomado ' + p_tipo_laboratorio + ' de ' + laboratorio + '.'; 
        speakOutput = speakOutput + '\nPara consultar los laboratorios e imágenes diagnósticas pendientes, di, consulta laboratorios pendientes.';
      }
    }
    catch(err){
      console.log('Error AddLaboratoriosIntent=' + JSON.stringify(err));
      speakOutput = 'Por favor, dime un nombre de laboratorio valido, por ejemplo, agrega laboratorio de creatinina.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

async function UpdateLaboratorioIntent (handlerInput, p_tipo_laboratorio) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  const nom_laboratorio = slots.nom_laboratorio.value;
  let query = await queryLaboratorio(id_usuario, p_tipo_laboratorio, nom_laboratorio);
  console.log('UpdateLaboratorioIntent query=' + JSON.stringify(query));

  let speakOutput = '';

  if (query.Count === 0) {
    speakOutput = speakOutput + 'No existe '+ p_tipo_laboratorio + ' de ' + nom_laboratorio + '.';
  }
  else{
    query = await updateLaboratorio(id_usuario, p_tipo_laboratorio, nom_laboratorio);
    speakOutput = speakOutput + p_tipo_laboratorio + ' de ' + nom_laboratorio + ' ha sido actualizado a tomado. ';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

export const LaboratoriosHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddLaboratoriosIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'ConsultarLaboratoriosIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'UpdateLaboratorioIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'AddImagenDiagnosticaIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'UpdateImagenDiagnosticaIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddLaboratoriosIntent'){
        return await AddLaboratoriosIntent(handlerInput, 'Laboratorio');
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarLaboratoriosIntent'){
        return await ConsultarLaboratoriosIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'UpdateLaboratorioIntent'){
        return await UpdateLaboratorioIntent(handlerInput, 'Laboratorio');
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'AddImagenDiagnosticaIntent'){
        return await AddLaboratoriosIntent(handlerInput, 'Imagen Diagnóstica');
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'UpdateImagenDiagnosticaIntent'){
        return await UpdateLaboratorioIntent(handlerInput, 'Imagen Diagnóstica');
      }
    }      
};