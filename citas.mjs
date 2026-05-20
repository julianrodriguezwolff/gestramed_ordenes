import { config, credentials, region } from './config.mjs'; 
import { updateAutorizacion, queryAutorizacion} from './autorizaciones.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 



async function addCita(p_id_cita, p_id_usuario, p_nom_especialidad, p_fecha_cita, p_hora_cita, p_requisitos, p_estado) {
 
    const query = await updateAutorizacion(p_id_usuario, p_nom_especialidad);

    const params = {
      TableName: config.dynamo.citas,
      Item: {
        id_cita: p_id_cita,
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        nom_especialidad: p_nom_especialidad,
        fecha_cita: p_fecha_cita,
        hora_cita: p_hora_cita,
        requisitos: p_requisitos,
        estado: p_estado
      }
    };     
    
    return await addTable(params);
  };

async function queryCitas(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.citas,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado ", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
        },
      };

    return queryTable(params);
}

async function queryCita(p_id_usuario, p_nom_especialidad) {
    
    const params = {
        TableName: config.dynamo.citas,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado AND nom_especialidad = :nom_especialidad", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Pendiente",
          ":nom_especialidad": p_nom_especialidad
        },
      };

    return queryTable(params);
}

export async function updateCita(p_id_usuario, p_nom_especialidad) {
    
  const query = await queryCita(p_id_usuario, p_nom_especialidad);  
  console.log('updateCita query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_cita = query.Items[0].id_cita;
    console.log('updateCita id_cita=' + id_cita);
    const params = {
      TableName: config.dynamo.citas,
      Key: { id_cita: id_cita, id_usuario: p_id_usuario },
      UpdateExpression: "set estado = :estado",
      ConditionExpression: "nom_especialidad = :nom_especialidad",
      ExpressionAttributeValues: {
        ":nom_especialidad": p_nom_especialidad,
        ":estado": 'Asistida'
      },
    };

    return updateTable(params);
  }
  return null;    
}

async function UpdateCitaIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  const especialidad = slots.especialidad.value;
  let query = await queryCita(id_usuario, especialidad);
  console.log('UpdateCitaIntent query=' + JSON.stringify(query));

  let speakOutput = '';

  if (query.Count === 0) {
    speakOutput = speakOutput + 'No existe la cita de ' + especialidad + '.';
  }
  else{
    query = await updateCita(id_usuario, especialidad);
    speakOutput = speakOutput + 'La cita de ' + especialidad + ' ha sido actualizada a asistida. ';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function ConsultarCitasIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await queryCitas(id_usuario);
  console.log('ConsultarCitasIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' citas pendientes.\n';

  if (query.Count > 0) {
    speakOutput = speakOutput + 'Las especialidades son:\n';

    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + (i + 1) + '. ' + query.Items[i].nom_especialidad + ' para el ' + query.Items[i].fecha_cita + ' a las ' + query.Items[i].hora_cita;      
      if (query.Items[i].requisitos !== undefined){
           speakOutput = speakOutput + ', requiere ' + query.Items[i].requisitos;
      }
      else{
            speakOutput = speakOutput + ', sin requisitos';
      }
      speakOutput = speakOutput + '.';
    }
    speakOutput = speakOutput + '\nCuando haya asistido a la cita, di, asistí a la cita de ' + query.Items[0].nom_especialidad  + '.';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddCitaIntent (handlerInput) { 

  let speakOutput = '';
  console.log('Entra a AddCitaIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  
  const especialidad = slots.especialidad.value;
  const fecha_cita = slots.fecha.value;
  const hora_cita = slots.hora.value;
  console.log('especialidad=' + especialidad);
  console.log('fecha_cita=' + fecha_cita);
  console.log('hora_cita=' + hora_cita);

  if (especialidad === undefined || fecha_cita === undefined || hora_cita === undefined) {
    speakOutput = 'Por favor, dime la especialidad, fecha y hora, por ejemplo, cita médica pediatría el 10 de marzo 10:00 a.m.';
  }
  else{
    try{
      const id_usuario = handlerInput.requestEnvelope.session.user.userId;

      let query = await queryAutorizacion(id_usuario, especialidad);  
      console.log('queryAutorizacion query=' + JSON.stringify(query));
      if (query.Count === 0) {  
        speakOutput = 'No existe autorización de especialidad ' + especialidad + ' pendientes para agendar cita. Por favor, primero agrega la especialidad diciendo, por ejemplo, autoriza ' + especialidad + ' .';
      }
      else{
        let id_cita = Number(query.Items[0].id_autorizacion);
        console.log('id_cita=' + id_cita);
        if (id_cita === undefined || Number.isNaN(id_cita)) {
          id_cita = new Date().getTime();
        }
        console.log('id_cita=' + id_cita);
        
        let requisitos = query.Items[0].requisitos;
        console.log('requisitos=' + requisitos);

        query = await addCita(id_cita, id_usuario, especialidad, fecha_cita, hora_cita, requisitos, 'Pendiente');
        speakOutput = 'Cita de ' + especialidad + ' programada para el ' + fecha_cita + ' a las ' + hora_cita;
        if (requisitos !== undefined){
           speakOutput = speakOutput + ', requiere ' + requisitos;
        }
        else{
           speakOutput = speakOutput + ', sin requisitos';
        }
        speakOutput = speakOutput + '.\nCuando haya asistido a la cita, di, asistí a la cita de ' + especialidad + '.';
        speakOutput = speakOutput + '\nPara consultar las citas programadas, di, consulta citas pendientes. ';
      }
    }
    catch(err){
      console.log('Error en AddAutorizacionIntent:' + err);
      speakOutput = 'Ha ocurrido un error al intentar agendar la cita de ' + especialidad + '.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

export const CitasHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddCitaIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'ConsultarCitasIntent' || 
                handlerInput.requestEnvelope.request.intent.name === 'UpdateCitaIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddCitaIntent'){
        return await AddCitaIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarCitasIntent'){
        return await ConsultarCitasIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'UpdateCitaIntent'){
        return await UpdateCitaIntent(handlerInput);
      }
    }
      
};