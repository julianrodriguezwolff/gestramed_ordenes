import { config, credentials, region } from './config.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 

async function addSigno(p_id_signo, p_id_usuario, p_nom_signo, p_valor_signo) {
 
    const params = {
      TableName: config.dynamo.signos,
      Item: {
        id_signo: p_id_signo,
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        nom_signo: p_nom_signo,
        valor_signo: p_valor_signo,
        fecha_signo: new Date().toISOString()
      }
    };     
    
    return await addTable(params);
  };

   export async function querySigno(p_id_usuario, p_nom_signo) {
    
    const params = {
        TableName: config.dynamo.signos,
        FilterExpression: "id_usuario = :id_usuario AND nom_signo = :nom_signo", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
          ":nom_signo": p_nom_signo
        },
      };

    return queryTable(params);
}

  async function querySignos(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.signos,
        FilterExpression: "id_usuario = :id_usuario", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario
        },
      };

    return queryTable(params);
}

export async function updateSigno(p_id_usuario, p_nom_signo) {
    
  const query = await querySigno(p_id_usuario, p_nom_signo);  
  console.log('updateSigno query=' + JSON.stringify(query));
  if (query.Count > 0) {          
    const id_signo = query.Items[0].id_signo;
    console.log('updateSigno id_signo=' + id_signo);
    const params = {
      TableName: config.dynamo.signos,
      Key: { id_signo: id_signo, id_usuario: p_id_usuario },
      UpdateExpression: "set valor_signo = :valor_signo",
      ConditionExpression: "nom_signo = :nom_signo",
      ExpressionAttributeValues: {
        ":nom_signo": p_nom_signo,
        ":valor_signo": p_valor_signo
      },
    };

    return updateTable(params);
  }
  return null;    
}

async function ConsultarSignosIntent (handlerInput) { 
    
  const id_usuario = handlerInput.requestEnvelope.session.user.userId;
  const query = await querySignos(id_usuario);
  console.log('ConsultarSignosIntent query=' + JSON.stringify(query));

  let speakOutput = 'Tienes ' + query.Count + ' signos registrados.';

  if (query.Count > 0) {
    for (let i = 0; i < query.Count; i++) {
      console.log('item=' + JSON.stringify(query.Items[i]));
      speakOutput = speakOutput + '\n' + (i + 1) + '. ' + new Date(query.Items[i].fecha_signo).toLocaleDateString('es-ES') + ' ' + query.Items[i].nom_signo + ': ' + query.Items[i].valor_signo + '.';
    }
  }
  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();
    
};

async function AddSignoIntent (handlerInput) { 

  let speakOutput = '';
  console.log('Entra a AddSignoIntent');
  const slots = handlerInput.requestEnvelope.request.intent.slots;
  
  const signo = slots.nom_signo.value;
  const valor_signo = slots.valor_signo.value;
  console.log('signo=' + signo);
  console.log('valor_signo=' + valor_signo);

  if (signo === undefined || valor_signo === undefined) {
    speakOutput = 'Por favor, dime el nombre y el valor del signo, por ejemplo, agrega signo de oximetría con valor 98.';
  }
  else{
    try{
        const id_usuario = handlerInput.requestEnvelope.session.user.userId;

        let id_signo =  new Date().getTime();
        console.log('id_signo=' + id_signo);
        
        const query = await addSigno(id_signo, id_usuario, signo, valor_signo);
        speakOutput = 'Signo de ' + signo + ' con valor ' + valor_signo + ' registrado correctamente.\n';
        speakOutput = speakOutput + 'Para consultar, di, consulta signos.';
      }
    catch(err){
      console.log('Error en AddSignoIntent=' + JSON.stringify(err));
      speakOutput = 'Por favor, dime el nombre y el valor del signo, por ejemplo, agrega signo de oximetría con valor 98.';
    }          
  }
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

export const SignosHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AddSignosIntent' ||
              handlerInput.requestEnvelope.request.intent.name === 'ConsultarSignosIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'AddSignosIntent'){
        return await AddSignoIntent(handlerInput);
      }
      else if (handlerInput.requestEnvelope.request.intent.name === 'ConsultarSignosIntent'){
        return await ConsultarSignosIntent(handlerInput);
      }
    }      
};