

async function CondicionesIntent (handlerInput) { 

  console.log('Entra a CondicionesIntent');
  let speakOutput = 'Términos y condiciones de uso'
                  + '\nSkill Alexa: Gestión de Tratamientos Médicos'
                  + '\n1. Introducción'
                  + '\nBienvenido a la skill Gestión de Tratamientos Médicos. Al usar esta skill aceptas estos términos y condiciones. Si no estás de acuerdo con alguno, no uses la skill.'
                  + '\n2. Servicio'
                  + '\nEsta skill está diseñada para ayudarte a gestionar recordatorios, seguimientos y datos básicos relacionados con tus tratamientos médicos. No sustituye la consulta, diagnóstico o tratamiento de un profesional de la salud.'
                  + '\n3. Alcance'
                  + '\nNo brinda asesoramiento médico profesional.'
                  + '\nNo reemplaza a tu médico, especialista o servicio de emergencia.'
                  + '\nEs una herramienta de soporte para recordatorios, organización y seguimiento.'
                  + '\n4. Uso permitido'
                  + '\nPuedes usar la skill para:'
                  + '\nRegistrar y consultar recordatorios de medicación.'
                  + '\nLlevar un seguimiento simple de tratamientos.'
                  + '\nRecibir notificaciones de horario.'
                  + '\nNo uses la skill para:'
                  + '\nCompartir información médica sensible de terceros sin su consentimiento.'
                  + '\nTomar decisiones clínicas importantes sin consultar a un profesional.'
                  + '\nManipular funciones de emergencia.'
                  + '\n5. Responsabilidades del usuario'
                  + '\nEl usuario se compromete a:'
                  + '\nProporcionar datos veraces y actualizados.'
                  + '\nRevisar la información con su equipo médico.'
                  + '\nNo confiar exclusivamente en la skill para el manejo de enfermedades.'
                  + '\n6. Privacidad y datos'
                  + '\nLa skill puede solicitar datos de salud y de tratamiento.'
                  + '\nEs tu responsabilidad revisar y aceptar la política de privacidad asociada.'
                  + '\nLa skill no debe usarse para compartir datos médicos sensibles en entornos públicos.'
                  + '\n7. Seguridad'
                  + '\nProtege tu cuenta de Amazon y tu dispositivo Alexa.'
                  + '\nNo compartas acceso a la skill con personas no autorizadas.'
                  + '\n8. Limitación de responsabilidad'
                  + '\nEl desarrollador no es responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la skill.'
                  + '\nNo se asume responsabilidad por errores, interrupciones o pérdida de datos.'
                  + '\n9. Cambios en los términos'
                  + '\nEstos términos pueden modificarse en cualquier momento. El uso continuado de la skill después de cambios implica aceptación de los nuevos términos.'
                  + '\n10. Terminación'
                  + '\nEl uso de la skill puede suspenderse o terminarse sin previo aviso si se detecta un uso indebido o una violación de estos términos.'
                  + '\n11. Legislación aplicable'
                  + '\nEstos términos se regirán por las leyes aplicables en el país o región donde opere la skill, respetando los derechos del usuario según la normativa local.'
                  + '\n12. Contacto'
                  + '\nPara preguntas o aclaraciones, utiliza los canales de soporte proporcionados en la descripción de la skill en la tienda Alexa.'
                  + '\nNota: Gestión de Tratamientos Médicos es una ayuda complementaria, no un servicio médico.';
  
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

export const CondicionesHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'CondicionesIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'CondicionesIntent'){
        return await CondicionesIntent(handlerInput);
      }
    }      
};