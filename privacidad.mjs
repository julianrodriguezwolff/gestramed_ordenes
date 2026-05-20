

async function PrivacidadIntent (handlerInput) { 

  console.log('Entra a PrivacidadIntent');
  let speakOutput = 'Política de Privacidad: GESTRAMED - Gestión de Tratamientos Médicos'
                    + '\nÚltima actualización: 17 de abril de 2026'
                    + '\n1. Introducción'
                    + '\nLa Skill GESTRAMED - Gestión de Tratamientos Médicos (en adelante, "la Skill") '
                    + '\nestá diseñada para ayudarte a organizar y recordar tus tomas de medicamentos y '
                    + '\nseguimiento de tratamientos. Tu privacidad es nuestra prioridad, especialmente al '
                    + '\ntratarse de información relacionada con tu bienestar.'
                    + '\n2. Información que recopilamos'
                    + '\nPara funcionar correctamente, la Skill solicita y almacena los siguientes datos:'
                    + '\n Datos Personales: Nombre (para personalizar el trato) y, opcionalmente, '
                    + '\nedad o género si el usuario decide proporcionarlos para ajustar las '
                    + '\nrecomendaciones de dosis. '
                    + '\n Datos de Salud: Nombres de medicamentos, horarios de toma, dosis y '
                    + '\nduración de tratamientos. '
                    + '\n Historial de Usuario: Registramos el cumplimiento de tus tomas (si '
                    + '\nconfirmas haber tomado una dosis) para ofrecerte reportes de progreso.' 
                    + '\n Identificadores Técnicos: Utilizamos el ID de usuario proporcionado por '
                    + '\nAmazon Alexa para vincular tus recordatorios a tu cuenta de forma anónima. '
                    + '\n3. Lo que NO recopilamos'
                    + '\n Historias Clínicas: La Skill no solicita, almacena ni tiene acceso a tu '
                    + '\nexpediente médico electrónico, diagnósticos médicos complejos, resultados '
                    + '\nde laboratorio o historial clínico integral de instituciones de salud. '
                    + '\n Grabaciones de Voz: El procesamiento de audio lo realiza Amazon; '
                    + '\nnosotros solo recibimos la transcripción de texto necesaria para ejecutar el '
                    + '\ncomando. '
                    + '\n4. Uso de la información'
                    + '\nLos datos se utilizan exclusivamente para:'
                    + '\n Programar y emitir recordatorios de medicación. '
                    + '\n Mantener un historial de cumplimiento para consulta del usuario. '
                    + '\n Mejorar la precisión de las respuestas de la Skill. '
                    + '\n5. Almacenamiento y Seguridad'
                    + '\nTus datos se almacenan en servidores seguros y solo se asocian a tu identificador '
                    + '\nde Alexa. No vendemos ni compartimos estos datos con anunciantes ni terceros. Te '
                    + '\nrecomendamos no compartir información sensible (como números de seguridad '
                    + '\nsocial) a través de la voz.'
                    + '\n6. Control del Usuario y Derechos'
                    + '\n Puedes consultar o borrar tu historial de tomas solicitándolo directamente a la '
                    + '\nSkill o contactándonos. '
                    + '\n Puedes revocar los permisos de la Skill o desactivarla en cualquier momento '
                    + '\ndesde la App de Alexa, lo que detendrá el procesamiento de tus datos. '
                    + '\n7. Contacto'
                    + '\nPara cualquier duda o ejercicio de tus derechos de protección de datos, escríbenos '
                    + '\na: julianrodriguezwolff@gmail.com.';
  
                                  
  return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput) 
      .withShouldEndSession(false)
      .getResponse();    
};

export const PrivacidadHandler = { 
    canHandle(handlerInput) {      
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'PrivacidadIntent');
    },
    async handle(handlerInput) {
      if (handlerInput.requestEnvelope.request.intent.name === 'PrivacidadIntent'){
        return await PrivacidadIntent(handlerInput);
      }
    }      
};