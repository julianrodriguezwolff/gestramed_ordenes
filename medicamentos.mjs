import { config, credentials, region } from './config.mjs'; 
import { updateAutorizacion, queryAutorizacion} from './autorizaciones.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 



async function addMedicamento(p_id_medicamento, p_id_usuario, p_nom_medicamento, p_dosis, p_hora_inicio, p_frecuencia, p_duracion) {
 
    const params = {
      TableName: config.dynamo.medicamentos,
      Item: {
        id_medicamento: p_id_medicamento,
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        nom_medicamento: p_nom_medicamento,
        dosis: p_dosis,
        hora_inicio: p_hora_inicio,
        frecuencia: p_frecuencia,
        duracion: p_duracion,
        estado: 'Vigente'
      }
    };     
    
    return await addTable(params);
  };

async function queryMedicamentos(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.medicamentos,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado ", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Vigente",
        },
      };

    return queryTable(params);
}

async function queryMedicamento(p_id_usuario, p_nom_medicamento) {
    
    const params = {
        TableName: config.dynamo.medicamentos,
        FilterExpression: "id_usuario = :id_usuario AND estado = :estado AND nom_medicamento = :nom_medicamento", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":estado": "Vigente",
          ":nom_medicamento": p_nom_medicamento
        },
      };

    return queryTable(params);
}

export async function updateMedicamento(p_id_usuario, p_nom_medicamento) {
    
  const query = await queryMedicamento(p_id_usuario, p_nom_medicamento);  
  console.log('updateMedicamento query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_medicamento = query.Items[0].id_medicamento;
    console.log('updateMedicamento id_medicamento=' + id_medicamento);
    const params = {
      TableName: config.dynamo.medicamentos,
      Key: { id_medicamento: id_medicamento, id_usuario: p_id_usuario },
      UpdateExpression: "set estado = :estado",
      ConditionExpression: "nom_medicamento = :nom_medicamento",
      ExpressionAttributeValues: {
        ":nom_medicamento": p_nom_medicamento,
        ":estado": 'Finalizado'
      },
    };

    return updateTable(params);
  }
  return null;    
}


async function ConsultarMedicamentosIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await queryMedicamentos(id_usuario);
  console.log('ConsultarMedicamentosIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' medicamentos vigentes.\n';

  if (query.Count > 0) {

    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + (i + 1) + '. ' + query.Items[i].nom_medicamento + ' ' + query.Items[i].dosis + ' inicia a las ' + query.Items[i].hora_inicio + ' con frecuencia ' + query.Items[i].frecuencia + ' durante ' + query.Items[i].duracion + '.\n';      
    }
    speakOutput = speakOutput + '\nPara marcar un medicamento como finalizado, di, por ejemplo, He finalizado el medicamento ' + query.Items[0].nom_medicamento + '.';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddMedicamentoIntent (handlerInput) { 

  let speakOutput = '';
  console.log('Entra a AddMedicamentoIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;

  const p_nom_medicamento = slots.nom_medicamento.value;
  const p_dosis = slots.dosis.value;
  const p_hora_inicio = slots.hora_inicio.value;
  const p_frecuencia = slots.frecuencia.value;
  const p_duracion = slots.duracion.value;

  console.log('p_nom_medicamento=' + p_nom_medicamento);
  console.log('p_dosis=' + p_dosis);
  console.log('p_hora_inicio=' + p_hora_inicio);
  console.log('p_frecuencia=' + p_frecuencia);
  console.log('p_duracion=' + p_duracion);

  if (p_nom_medicamento === undefined || p_dosis === undefined || p_hora_inicio === undefined || p_frecuencia === undefined || p_duracion === undefined) {
    speakOutput = 'Por favor, dime el nombre del medicamento, la dosis, la hora de inicio, la frecuencia y la duración, por ejemplo, agrega el medicamento acetaminofén con dosis 500 mg, hora de inicio 8:00 a.m., frecuencia 3 veces al día y duración 5 días.';
  }
  else{
    try{
        const id_usuario = handlerInput.requestEnvelope.session.user.userId;

        let query = await queryMedicamento(id_usuario, p_nom_medicamento);  
        console.log('queryMedicamento query=' + JSON.stringify(query));
        console.log('queryMedicamento query.Count=' + query.Count);
        if (query.Count > 0) {  
          speakOutput = 'Ya existe dosificación de ' + p_nom_medicamento + ' vigente';
        }
        else{      
          let id_medicamento = new Date().getTime();
          console.log('id_medicamento=' + id_medicamento);

          query = await addMedicamento(id_medicamento, id_usuario, p_nom_medicamento, p_dosis, p_hora_inicio, p_frecuencia, p_duracion);
          speakOutput = 'Medicamento ' + p_nom_medicamento + ' agregado correctamente.';
          speakOutput = speakOutput + '\nPara dar por terminado un medicamento, di, he finalizado el medicamento ' + p_nom_medicamento + '.'; 
          speakOutput = speakOutput + '\nPara consultar los medicamentos vigentes, di, consulta medicamentos vigentes.';

        }
    }
    catch(err){
      console.log('Error en AddMedicamentoIntent:' + err);
      speakOutput = 'Ha ocurrido un error al intentar agregar el medicamento ' + p_nom_medicamento + '.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

async function UpdateMedicamentoIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  const nom_medicamento = slots.nom_medicamento.value;
  let query = await queryMedicamento(id_usuario, nom_medicamento);
  console.log('UpdateMedicamentoIntent query=' + JSON.stringify(query));

  let speakOutput = '';

  if (query.Count === 0) {
    speakOutput = speakOutput + 'No existe el medicamento de ' + nom_medicamento + '.';
  }
  else{
    query = await updateMedicamento(id_usuario, nom_medicamento);
    speakOutput = speakOutput + 'El medicamento de ' + nom_medicamento + ' ha sido actualizado a finalizado. ';
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

export const MedicamentosHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddMedicamentosIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'ConsultarMedicamentosIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'UpdateMedicamentoIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddMedicamentosIntent'){
        return await AddMedicamentoIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarMedicamentosIntent'){
        return await ConsultarMedicamentosIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'UpdateMedicamentoIntent'){
        return await UpdateMedicamentoIntent(handlerInput);
      }
    }
      
};


