export const publicSiteConfig = {
  whatsapp: 'https://wa.me/525651819358?text=Hola%2C%20quiero%20agendar%20una%20cita%20en%20Fermont%20Skin%20Studio.%20%C2%BFMe%20ayudan%20a%20revisar%20la%20disponibilidad%3F',
  recommendationWhatsapp: 'https://wa.me/525651819358?text=Hola%2C%20no%20s%C3%A9%20qu%C3%A9%20servicio%20elegir.%20%C2%BFQu%C3%A9%20tratamiento%20me%20recomiendan%20seg%C3%BAn%20las%20necesidades%20de%20mi%20piel%3F',
  instagram: 'https://www.instagram.com/f_e_r_m_o_n_t?igsh=MWNoNGVtanpobWtxdQ==',
  tiktok: 'https://www.tiktok.com/@fermont.skin.beauty?_r=1&_t=ZS-98t8QVerFcj',
  location: 'https://maps.app.goo.gl/4BpQuoPZU8Etr9uPA?g_st=iw',
  schedule: 'Lunes a sábado · Previa cita',
}

export const serviceCategories = [
  {
    id: 'faciales',
    icon: 'sparkles',
    kicker: 'Faciales',
    title: 'Cuidado facial para cada momento de tu piel',
    description: 'Elige una experiencia de limpieza, hidratación, luminosidad, renovación o relajación. Cada protocolo se adapta a las características de tu piel después de una valoración personalizada.',
    accent: '#9a6741',
    soft: '#f1dfd0',
    items: [
      {
        icon: 'sparkles',
        title: 'Facial Esencial',
        tag: 'Inicio suave',
        description: 'Limpieza, exfoliación suave, tonificación, mascarilla e hidratación para una piel de aspecto fresco, suave y cuidado.',
      },
      {
        icon: 'scan',
        title: 'Limpieza Facial Profunda',
        tag: 'Profunda',
        description: 'Limpieza facial profunda, extracción cosmética de comedones y aparatología según valoración, enfocada en retirar impurezas superficiales y mejorar la apariencia de la piel.',
      },
      {
        icon: 'leaf',
        title: 'Facial Purificante',
        tag: 'Equilibrio',
        description: 'Cuidado cosmético especialmente pensado para piel con tendencia grasa, brillo excesivo, poros congestionados e imperfecciones visibles.',
      },
      {
        icon: 'heart',
        title: 'Facial Piel Sensible',
        tag: 'Calma',
        description: 'Limpieza e hidratación suave con productos seleccionados para piel delicada o reactiva, enfocada en aportar confort y una agradable sensación de calma.',
      },
      {
        icon: 'heart',
        title: 'Hidratación Intensiva',
        tag: 'Hidratación',
        description: 'Experiencia enfocada en favorecer la hidratación superficial de la piel y aportar suavidad, frescura y una agradable sensación de confort.',
      },
      {
        icon: 'stars',
        title: 'Facial Iluminador',
        tag: 'Luminosidad',
        description: 'Exfoliación y cuidado cosmético enfocados en mejorar la apariencia de la piel opaca y favorecer un aspecto más luminoso y uniforme.',
      },
      {
        icon: 'sparkles',
        title: 'Facial Revitalizante',
        tag: 'Vitalidad',
        description: 'Cuidado cosmético enfocado en la hidratación, luminosidad y apariencia de las líneas finas, para una piel de aspecto fresco y cuidado.',
      },
      {
        icon: 'heart',
        title: 'Facial Chocolate',
        tag: 'Sensorial',
        description: 'Experiencia facial sensorial con productos cosméticos de chocolate, mascarilla y masaje relajante, pensada para consentir tu piel y disfrutar un momento de bienestar.',
      },
      {
        icon: 'leaf',
        title: 'Facial Renovador',
        tag: 'Textura',
        description: 'Exfoliación y renovación cosmética superficial enfocadas en mejorar la apariencia de la textura, suavidad y luminosidad de la piel.',
      },
      {
        icon: 'stars',
        title: 'Exfoliación Cosmética Iluminadora',
        tag: 'Exfoliación',
        description: 'Exfoliación cosmética superficial con productos seleccionados según las características de tu piel, enfocada en el cuidado de la textura y luminosidad.',
      },
      {
        icon: 'scan',
        title: 'Facial LED',
        tag: 'Luz LED estética',
        description: 'Experiencia facial personalizada que incorpora luz LED como complemento cosmético, de acuerdo con la valoración de la piel y las indicaciones del equipo.',
      },
      {
        icon: 'sparkles',
        title: 'Facial Deluxe Fermont',
        tag: 'Experiencia completa',
        description: 'Limpieza facial profunda, aparatología cosmética seleccionada según valoración, mascarilla personalizada y masaje para una experiencia de cuidado facial completa.',
      },
      {
        icon: 'heart',
        title: 'Masaje Facial Relajante',
        tag: 'Relax',
        description: 'Masaje de rostro, cuello y escote con maniobras suaves enfocadas en la relajación, el descanso y el bienestar facial.',
      },
    ],
  },
  {
    id: 'corporales',
    icon: 'body',
    kicker: 'Corporales',
    title: 'Bienestar corporal con enfoque estético y relajante',
    description: 'Experiencias de cuidado corporal enfocadas en el bienestar, la relajación y la atención personalizada de distintas zonas del cuerpo.',
    accent: '#6b7f5b',
    soft: '#e3ead9',
    items: [
      {
        icon: 'body',
        title: 'Masaje Corporal Relajante',
        tag: 'Descanso',
        description: 'Masaje manual con maniobras suaves y relajantes, enfocado en brindar una agradable sensación de descanso, confort y bienestar corporal.',
      },
      {
        icon: 'body',
        title: 'Masaje Modelador Manual',
        tag: 'Modelador',
        description: 'Masaje estético con maniobras manuales enfocadas en el cuidado del contorno corporal de abdomen, cintura u otras zonas, según valoración.',
      },
    ],
  },
  {
    id: 'ritual-renovador',
    icon: 'stars',
    kicker: 'Ritual corporal renovador',
    title: 'Exfoliación, hidratación y masaje en un mismo ritual',
    description: 'Una experiencia de cuidado corporal que combina exfoliación cosmética, hidratación y masaje relajante, pensada para aportar suavidad a la piel y una agradable sensación de bienestar.',
    accent: '#a66a78',
    soft: '#f1dde1',
    items: [
      {
        icon: 'stars',
        title: 'Brazos más piernas',
        tag: 'Ritual completo',
        description: 'Exfoliación cosmética, hidratación y masaje relajante para consentir la piel de brazos y piernas en una sola experiencia.',
      },
      {
        icon: 'leaf',
        title: 'Solo brazos',
        tag: 'Zona específica',
        description: 'Cuidado corporal que combina exfoliación, hidratación y masaje para aportar suavidad y una agradable sensación de bienestar a la piel de los brazos.',
      },
      {
        icon: 'leaf',
        title: 'Solo piernas',
        tag: 'Zona específica',
        description: 'Experiencia de exfoliación, hidratación y masaje enfocada en el cuidado de la piel de las piernas, aportando suavidad y una sensación de descanso.',
      },
    ],
  },
]

export const experienceValues = [
  {
    icon: 'heart',
    title: 'Atención cercana',
    description: 'Un espacio privado donde puedes expresar con confianza lo que buscas.',
  },
  {
    icon: 'leaf',
    title: 'Cuidado consciente',
    description: 'Cada paso tiene una intención y se adapta a las necesidades de tu piel.',
  },
  {
    icon: 'stars',
    title: 'Experiencia especial',
    description: 'Detalles pensados para que tu visita también sea un momento de calma.',
  },
]

export const careSteps = [
  {
    number: '01',
    title: 'Te escuchamos',
    description: 'Conversamos sobre tus necesidades, hábitos y objetivos de cuidado.',
  },
  {
    number: '02',
    title: 'Diseñamos tu experiencia',
    description: 'Seleccionamos el protocolo cosmético y las recomendaciones de cuidado más adecuadas según tu valoración.',
  },
  {
    number: '03',
    title: 'Acompañamos tu proceso',
    description: 'Te compartimos recomendaciones de cuidado posterior y, si lo deseas, damos seguimiento a tu experiencia.',
  },
]

export const frequentlyAskedQuestions = [
  {
    question: '¿Necesito una valoración antes de mi tratamiento?',
    answer: 'Sí. Antes de comenzar, conocemos las características de tu piel, tus objetivos de cuidado y posibles contraindicaciones para seleccionar el servicio más adecuado.',
  },
  {
    question: '¿Cómo puedo agendar una cita?',
    answer: 'Puedes escribirnos directamente por WhatsApp. Ahí te compartiremos los horarios disponibles y resolveremos tus dudas.',
  },
  {
    question: '¿La atención es personalizada?',
    answer: 'Sí. Cada visita se realiza de forma individual y el protocolo se adapta a tus objetivos de cuidado y a las características de tu piel.',
  },
]
