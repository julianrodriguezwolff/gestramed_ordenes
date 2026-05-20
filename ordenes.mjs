import { config, credentials, region } from './config.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 
import { getUsuario } from './usuarios.mjs'; 
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";


async function addOrden(p_id_orden, p_id_usuario, p_nom_especialidad, p_requisitos, p_estado) {
 
    const params = {
      TableName: config.dynamo.ordenes,
      Item: {
        id_orden: p_id_orden,
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        nom_especialidad: p_nom_especialidad,
        requisitos: p_requisitos,
        estado: p_estado
      }
    };     
    
    return await addTable(params);
  };

   export async function queryOrden(p_id_usuario, p_nom_especialidad) {
    
    const params = {
        TableName: config.dynamo.ordenes,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado AND nom_especialidad = :nom_especialidad", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
          ":nom_especialidad": p_nom_especialidad
        },
      };

    return queryTable(params);
}

  async function queryOrdenes(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.ordenes,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado ", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
        },
      };

    return queryTable(params);
}

export async function updateOrden(p_id_usuario, p_nom_especialidad) {
    
  const query = await queryOrden(p_id_usuario, p_nom_especialidad);  
  console.log('updateOrden query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_orden = query.Items[0].id_orden;
    console.log('updateOrden id_orden=' + id_orden);
    const params = {
      TableName: config.dynamo.ordenes,
      Key: { id_orden: id_orden, id_usuario: p_id_usuario },
      UpdateExpression: "set estado = :estado",
      ConditionExpression: "nom_especialidad = :nom_especialidad",
      ExpressionAttributeValues: {
        ":nom_especialidad": p_nom_especialidad,
        ":estado": 'Autorizada'
      },
    };

    return updateTable(params);
  }
  return null;    
}

async function ConsultarOrdenesIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await queryOrdenes(id_usuario);
  console.log('ConsultarOrdenesIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' órdenes pendientes.\n';

  if (query.Count > 0) {
    speakOutput = speakOutput + 'Las especialidades son:\n';

    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + (i + 1) + '. ' + query.Items[i].nom_especialidad;      
      if (query.Items[i].requisitos !== undefined && query.Items[i].requisitos !== ''){
        speakOutput = speakOutput + ', requiere ' + query.Items[i].requisitos;
      }
      else{
        speakOutput = speakOutput + ', sin requisitos';
      }
      speakOutput = speakOutput + '.\n';
    }
    speakOutput = speakOutput + 'Para autorizar, di, por ejemplo, autoriza ' + query.Items[0].nom_especialidad + '.';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddOrdenIntent (handlerInput) { 

  let speakOutput = '';
  console.log('Entra a AddOrdenIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  
  const especialidad = slots.especialidad.value;
  console.log('especialidad=' + especialidad);

  if (especialidad === undefined) {
    speakOutput = 'Por favor, dime la especialidad, por ejemplo, agrega orden de pediatría número 1759846. Requiere resultados de laboratorio de creatinina.';
  }
  else{
    try{
      const id_usuario = handlerInput.requestEnvelope.session.user.userId;

      let query = await queryOrden(id_usuario, especialidad);  
      console.log('updateOrden query=' + JSON.stringify(query));
      if (query.Count > 0) {  
        speakOutput = 'Ya existe una orden de especialidad ' + especialidad + ' cuyo número es ' + query.Items[0].id_orden;
      }
      else{

        let id_orden = Number(slots.id_orden.value);
        console.log('id_orden=' + id_orden);
        if (id_orden === undefined || Number.isNaN(id_orden)) {
          id_orden = new Date().getTime();
        }
        console.log('id_orden=' + id_orden);
        
        let requisitos = slots.requisitos.value;
        console.log('requisitos=' + requisitos);

        query = await addOrden(id_orden, id_usuario, especialidad, requisitos,'Pendiente');
        speakOutput = 'Orden de ' + especialidad + ' número ' + id_orden + ' registrada correctamente';
        if (requisitos !== undefined){
           speakOutput = speakOutput + ', requiere ' + requisitos ;
        }
        else{
          speakOutput = speakOutput + ', sin requisitos';
        }
        speakOutput = speakOutput + '.\nPara autorizarla, di, autoriza ' + especialidad + '.\nPara consultar las órdenes pendientes, di, consulta órdenes pendientes.';
      }
    }
    catch(err){
      speakOutput = 'Por favor, dime un número de orden valido, por ejemplo, agrega orden de ' + especialidad + ' número 175454 requiere prueba de creatinina.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

export const OrdenesHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddOrdenIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'ConsultarOrdenesIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddOrdenIntent'){
        return await AddOrdenIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarOrdenesIntent'){
        return await ConsultarOrdenesIntent(handlerInput);
      }
    }
      
};

export async function extraerDatosOrden(bucket, key) {
    console.log("Entra a extraerDatosOrden (Textract)" + " " + bucket + " " + key);
    const ordenClient = new TextractClient({
      region,
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
      const response = await ordenClient.send(command);
        
      // Filtramos por "LINE" para obtener oraciones completas legibles
      console.log("Procesa los datos obtenidos con Textract");
      let textoOrden;
      let id_orden;
      let especialidad = 'Especialidad no detectada';
      let especialidad_encontrada = false;
      response.Blocks.forEach((block) => {
          if (block.BlockType === "LINE") {
            textoOrden = block.Text.split(':')[0].trim();
            if (textoOrden === 'Nro Orden'){
              id_orden = Number(block.Text.split(':')[1].trim());
              console.log('Número de orden detectado: ' + id_orden);
            }
            if (textoOrden === 'Descripcion'){
              especialidad_encontrada = true;
            }
            if(especialidad_encontrada){
              console.log('textoOrden: ' + textoOrden);
              if (textoOrden.toUpperCase().includes('CONSULTA') || textoOrden.toUpperCase().includes('SEGUIMIENTO') || textoOrden.toUpperCase().includes('PRIMER')){
                especialidad = block.Text.split(' ')[0].trim() + ' ' + block.Text.split(' ')[1].trim();
                console.log('Especialidad detectada: ' + especialidad);
                especialidad_encontrada = false;
              }
            }
          }
      });
      // Procesar la respuesta aquí
      if (id_orden === undefined) {
        console.log("No es una orden válida o no se detectó número de orden en el documento");
        return null;
      }
      let aux_code = key.split('/')[1].split('-')[0];
      let userId = await getUsuario(aux_code);
      console.log('userId=' + userId + ' aux_code=' + aux_code);
      return await addOrden(id_orden, userId, especialidad, '', 'Pendiente');
    } catch (error) {
      console.log("Error analizando orden:"+ error);
      throw error;
    }
}