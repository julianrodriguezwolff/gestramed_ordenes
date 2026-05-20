import { UsuarioHandler, AuxCodeHandler, queryUsuario } from './usuarios.mjs'; 
import { OrdenesHandler, extraerDatosOrden} from './ordenes.mjs'; 
import { AutorizacionesHandler, extraerDatosAutorizacion} from './autorizaciones.mjs'; 
import { CitasHandler} from './citas.mjs';
import { LaboratoriosHandler} from './laboratorios.mjs';
import { SignosHandler} from './signos.mjs';
import { RestriccionesHandler} from './restricciones.mjs';
import { MedicamentosHandler} from './medicamentos.mjs';
import { CondicionesHandler} from './condiciones.mjs';
import { PrivacidadHandler} from './privacidad.mjs';
import * as Alexa from 'ask-sdk-core';

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    async handle(handlerInput) {
        let speechText = 'Sesión finalizada. ¡Hasta luego!';
        console.log('SessionEndedRequestHandler: ' + speechText);
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withShouldEndSession(true)
            .getResponse();
    },
}; 

const LaunchRequestHandler = {
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const id_usuario = handlerInput.requestEnvelope.session.user.userId;
        const query = await queryUsuario(id_usuario);
        console.log('query=' + JSON.stringify(query));

        let speechText = '';
        if (query.Count === 0) {
          speechText = 'Hola, eres un usuario nuevo, por favor dime tu nombre para registrarte, ejemplo: Mi nombre es Juan.\n';
          speechText = speechText + 'Al hacer esto aceptas los términos y condiciones y la política de tratamiento de datos y privacidad.\n';
          speechText = speechText + 'Di, léeme términos y condiciones, para conocer los términos y condiciones de uso.\n';
          speechText = speechText + 'Di, léeme la política de privacidad, para conocer la política de tratamiento de datos y privacidad.\n';
        }
        else{
          const nom_usuario = query.Items[0].nom_usuario;
          speechText = 'Hola, ' + nom_usuario.charAt(0).toUpperCase() + nom_usuario.slice(1).toLowerCase() + '. Bienvenido a tu asistente de salud. ¿En qué puedo ayudarte hoy? di, ayuda, para saber qué puedes hacer.';
        }

        const repromptText = '¿Sigues ahí?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(repromptText)
            .withShouldEndSession(false)
            .getResponse();
    },
}; 

const HelpIntentHandler = {
    canHandle(handlerInput) {
      
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'Puedo ayudarte a agregar y consultar tus órdenes médicas, autorizaciones, citas, laboratorios, imágenes diagnósticas restricciones y signos.';
        speakOutput = speakOutput + '\nPara consultar, di Consultar seguido de lo que quieres consultar, por ejemplo, consulta órdenes pendientes.';
        speakOutput = speakOutput + '\nPara agregar, di Agregar seguido de lo que quieres agregar, por ejemplo, agrega orden de pediatría número 1759846 requiere resultados de laboratorio de creatinina.';
        speakOutput = speakOutput + '\nDi Acerca de, para obtener información sobre la skill.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput) 
            .withShouldEndSession(false)
            .getResponse();
    }
};

const AboutHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AboutIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'Prototipo Gestramed.';
        speakOutput = speakOutput + '\nGestión de Tratamientos Médicos.';
        speakOutput = speakOutput + '\nVersión 1.0.0 (Mayo, 2026).';
        speakOutput = speakOutput + '\nAutor: Julián Andrés Rodríguez Wolff.';
        speakOutput = speakOutput + '\nCorreo: julianrodriguezwolff@gmail.com';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput) 
            .withShouldEndSession(false)
            .getResponse();
    }
};

export const handler = async (event) => { 
  
  console.log("Handler JSON="+JSON.stringify(event));
  let response;

  try{
    let bucket = event.Records[0].s3.bucket.name;
    let key = event.Records[0].s3.object.key;
    console.log('Intenta Lectura de S3:'+' '+bucket+' '+key);
    
    if(key.includes('orden')){
      response = await extraerDatosOrden(bucket, key);
    }
    else if(key.includes('autorizacion')){
      response = await extraerDatosAutorizacion(bucket, key);
    }
  }catch(err){
    console.log('No es evento de S3 o error: ' + err);
    try{
      console.log('Intenta manejar evento de Alexa Skills');

      const skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(LaunchRequestHandler, SessionEndedRequestHandler, HelpIntentHandler,
        UsuarioHandler, OrdenesHandler, AutorizacionesHandler, CitasHandler, 
        LaboratoriosHandler, SignosHandler, RestriccionesHandler, MedicamentosHandler,
        CondicionesHandler, PrivacidadHandler, AuxCodeHandler, AboutHandler)
      .create();

      response = await skill.invoke(event);
    }
    catch(err){
      console.log('No es evento de Alexa skills o error: ' + err);
      response = {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error al manejar evento de Alexa' }),
      };
    }
  }
  console.log("Response JSON="+JSON.stringify(response));
  return response;  
};



