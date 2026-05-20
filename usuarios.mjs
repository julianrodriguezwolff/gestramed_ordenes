import { config, credentials, region } from './config.mjs'; 
import { addTable, queryTable, updateTable } from './utils.mjs'; 

export async function queryUsuario(p_id_usuario) {
    
    const params = {
        TableName: config.dynamo.usuarios,
        FilterExpression: "id_usuario = :id_usuario", // Filtra después de leer
        ExpressionAttributeValues: {
          ":id_usuario": p_id_usuario,
        },
      };

    return queryTable(params);
}

async function getAuxCode(p_id_usuario) {          
    return p_id_usuario.charAt(35) + p_id_usuario.charAt(75) + p_id_usuario.charAt(110) + p_id_usuario.charAt(161) + p_id_usuario.charAt(229);
  };

export async function getUsuario(p_aux_code) {  
      const params = {
        TableName: config.dynamo.usuarios,
        FilterExpression: "aux_code = :aux_code", // Filtra después de leer
        ExpressionAttributeValues: {
          ":aux_code": p_aux_code,
        },
      };

    const query = await queryTable(params);        
    return query.Count > 0 ? query.Items[0].id_usuario : undefined;
  };  

async function addUsuario(p_id_usuario, p_nom_usuario, p_aux_code) {
 
    const params = {
      TableName: config.dynamo.usuarios,
      Item: {
        id_usuario: p_id_usuario,
        timestamp: new Date().getTime(),
        nom_usuario: p_nom_usuario.charAt(0).toUpperCase() + p_nom_usuario.slice(1),
        aux_code: p_aux_code
      }
    };     
    
    return await addTable(params);
  };

  export const UsuarioHandler = { 
      canHandle(handlerInput) {      
          return handlerInput.requestEnvelope.request.type === 'IntentRequest'
              && handlerInput.requestEnvelope.request.intent.name === 'AddUsuarioIntent';
      },
      async handle(handlerInput) {
        let speakOutput = '';
        const repromptText = '¿Sigues ahí?';
        if (handlerInput.requestEnvelope.request.intent.name === 'AddUsuarioIntent') {
          console.log('Entra a AddUsuarioIntentHandler');
          const slots = handlerInput.requestEnvelope.request.intent.slots;
          
          const nom_usuario = slots.nom_usuario.value;
          console.log('nom_usuario=' + nom_usuario);
  
          if (nom_usuario === undefined) {
            speakOutput = 'Por favor dime tu nombre, por ejemplo, Mi nombre es Juan.';
          }
          else{
            try{
              const id_usuario = handlerInput.requestEnvelope.session.user.userId;
              const aux_code = await getAuxCode(id_usuario);
              const query = await addUsuario(id_usuario, nom_usuario, aux_code);
              speakOutput = 'Usuario ' + nom_usuario.charAt(0).toUpperCase() + nom_usuario.slice(1) + ' registrado exitosamente.';
              speakOutput = speakOutput + '\nBienvenido a tu asistente de salud. ¿En qué puedo ayudarte hoy? di ayúdame para saber qué puedes hacer.';
            }
            catch(err){
              speakOutput = 'Por favor dime un nombre valido, por ejemplo, Mi nombre es Juan.';
            }          
          }
        }
                                         
        return handlerInput.responseBuilder
              .speak(speakOutput)
              .reprompt(repromptText)
              .withShouldEndSession(false)
              .getResponse();
      }
  };

  export const AuxCodeHandler = { 
      canHandle(handlerInput) {      
          return handlerInput.requestEnvelope.request.type === 'IntentRequest'
              && handlerInput.requestEnvelope.request.intent.name === 'AuxCodeIntent';
      },
      async handle(handlerInput) {
        console.log('Entra a AuxCodeIntentHandler');
        const auxCode = await getAuxCode(handlerInput.requestEnvelope.session.user.userId);
        const speakOutput = 'Tu código de carga es: ' + auxCode.charAt(0) + ', ' + auxCode.charAt(1) + ', ' + auxCode.charAt(2) + ', ' + auxCode.charAt(3) + ', ' + auxCode.charAt(4);   
        const repromptText = '¿Sigues ahí?';         
                                         
        return handlerInput.responseBuilder
              .speak(speakOutput)
              .reprompt(repromptText)
              .withShouldEndSession(false)
              .getResponse();
      }
  };