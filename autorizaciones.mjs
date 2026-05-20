import { config, credentials, region } from './config.mjs'; 
import { updateOrden, queryOrden} from './ordenes.mjs'; 
import { getUsuario } from './usuarios.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";


async function addAutorizacion(p_id_autorizacion, p_id_usuario, p_nom_especialidad, p_requisitos, p_estado) {
 
    const query = await updateOrden(p_id_usuario, p_nom_especialidad);

    const params = {
      TableName: config.dynamo.autorizaciones,
      Item: {
        id_autorizacion: p_id_autorizacion,
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        nom_especialidad: p_nom_especialidad,
        requisitos: p_requisitos,
        estado: p_estado
      }
    };     
    
    return await addTable(params);
  };

async function queryAutorizaciones(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.autorizaciones,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado ", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
        },
      };

    return queryTable(params);
}

export async function queryAutorizacion(p_id_usuario, p_nom_especialidad) {
    
    const params = {
        TableName: config.dynamo.autorizaciones,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado AND nom_especialidad = :nom_especialidad", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
          ":nom_especialidad": p_nom_especialidad
        },
      };

    return queryTable(params);
}

export async function updateAutorizacion(p_id_usuario, p_nom_especialidad) {
    
  const query = await queryAutorizacion(p_id_usuario, p_nom_especialidad);  
  console.log('updateAutorizacion query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_autorizacion = query.Items[0].id_autorizacion;
    console.log('updateAutorizacion id_autorizacion=' + id_autorizacion);
    const params = {
      TableName: config.dynamo.autorizaciones,
      Key: { id_autorizacion: id_autorizacion, id_usuario: p_id_usuario },
      UpdateExpression: "set estado = :estado",
      ConditionExpression: "nom_especialidad = :nom_especialidad",
      ExpressionAttributeValues: {
        ":nom_especialidad": p_nom_especialidad,
        ":estado": 'Programada'
      },
    };

    return updateTable(params);
  }
  return null;    
}


async function ConsultarAutorizacionesIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await queryAutorizaciones(id_usuario);
  console.log('ConsultarAutorizacionesIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' autorizaciones pendientes.\n';

  if (query.Count > 0) {
    speakOutput = speakOutput + 'Las especialidades son:\n';

    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + (i + 1) + '. ' + query.Items[i].nom_especialidad;   
      if (query.Items[i].requisitos !== undefined){
        speakOutput = speakOutput + ', requiere ' + query.Items[i].requisitos;
      }
      speakOutput = speakOutput + '.\n';
    }
    speakOutput = speakOutput + 'Para programar una cita, di, por ejemplo, cita médica de ' + query.Items[0].nom_especialidad + ' el 10 de marzo a las 10:00 a.m.';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddAutorizacionIntent (handlerInput) { 

  let speakOutput = '';
  console.log('Entra a AddAutorizacionIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  
  const especialidad = slots.especialidad.value;
  console.log('especialidad=' + especialidad);

  if (especialidad === undefined) {
    speakOutput = 'Por favor, dime la especialidad, por ejemplo, autoriza pediatría.';
  }
  else{
    try{
      const id_usuario = handlerInput.requestEnvelope.session.user.userId;

      let query = await queryOrden(id_usuario, especialidad);  
      console.log('updateOrden query=' + JSON.stringify(query));
      if (query.Count === 0) {  
        speakOutput = 'No existe orden de ' + especialidad + ' pendiente para autorizar. Por favor, primero agrega la orden diciendo, por ejemplo, agrega orden de ' + especialidad + ' número 1759846, requiere resultados de laboratorio de creatinina.';
      }
      else{
        let id_autorizacion = String(query.Items[0].id_orden);
        console.log('id_autorizacion=' + id_autorizacion);
        if (id_autorizacion === undefined) {
          id_autorizacion = String(new Date().getTime());
        }
        console.log('id_autorizacion=' + id_autorizacion);
        let requisitos = query.Items[0].requisitos;
        console.log('requisitos=' + requisitos);
        query = await addAutorizacion(id_autorizacion, id_usuario, especialidad, requisitos, 'Pendiente');
        speakOutput = 'Orden de ' + especialidad + ' número ' + id_autorizacion + ' autorizada';
        if (requisitos !== undefined && requisitos !== ''){
           speakOutput = speakOutput + ', requiere ' + requisitos;
        }
        else{
           speakOutput = speakOutput + ', sin requisitos';
        }
        speakOutput = speakOutput + '.\nPara agendar cita, di, por ejemplo, cita médica de ' + especialidad + ' el 10 de marzo a las 10:00 a.m.';
        speakOutput = speakOutput + '\nPara consultar las autorizaciones pendientes, di, consulta autorizaciones pendientes. ';
      }
    }
    catch(err){
      console.log('Error en AddAutorizacionIntent:' + err);
      speakOutput = 'Ha ocurrido un error al intentar autorizar la especialidad ' + especialidad + '.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

export const AutorizacionesHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddAutorizacionIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'ConsultarAutorizacionesIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddAutorizacionIntent'){
        return await AddAutorizacionIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarAutorizacionesIntent'){
        return await ConsultarAutorizacionesIntent(handlerInput);
      }
    }
      
};

export async function extraerDatosAutorizacion(bucket, key) {
    console.log("Entra a extraerDatosAutorizacion");
    const autorizacionClient = new TextractClient({
      region: region,
      credentials: credentials
    });
  
    const params = {
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key
        },
      },
    };
  
    try {
      const command = new DetectDocumentTextCommand(params);
      const response = await autorizacionClient.send(command);
      let textoAutorizacion;
      let id_encontrado = false;      
      let id_autorizacion;
      let especialidad;
      let especialidad_encontrada = false;
      response.Blocks.forEach((block) => {
          if (block.BlockType === "LINE") {
            console.log(block.Text);
            textoAutorizacion = block.Text.split(':')[0].trim();
            if(id_encontrado){
              id_autorizacion = block.Text.split(':')[0].trim();
              console.log('Número de autorización detectado: ' + id_autorizacion);
              id_encontrado = false;
            }
            if (textoAutorizacion === 'Autorización No.'){
              id_encontrado = true;
            }   

            if(especialidad_encontrada){
              especialidad = block.Text.split(' ')[2].trim() + ' ' + block.Text.split(' ')[3].trim();
              console.log('Especialidad detectada: ' + especialidad);
              especialidad_encontrada = false;
            }
            if (textoAutorizacion === 'Autorizado'){
              console.log('Clave de Especialidad detectada.');
              especialidad_encontrada = true;
            }  
            
          }
      });
      // Procesar la respuesta aquí
      if (id_autorizacion === undefined) {
        console.log("No es una autorización válida o no se detectó número de autorización en el documento");
        return null;
      }
      let aux_code = key.split('/')[1].split('-')[0];
      console.log('aux_code=' + aux_code);
      let userId = await getUsuario(aux_code);
      console.log('userId=' + userId);
      return await addAutorizacion(id_autorizacion, userId, especialidad, '', 'Pendiente');
    } catch (error) {
      console.log("Error analizando autorización:"+ error);
      throw error;
    }
  }
