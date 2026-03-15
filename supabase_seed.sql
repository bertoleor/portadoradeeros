-- ==============================================================
-- INSERTAR SERVICIOS INICIALES
-- Corre esto en el SQL Editor de Supabase
-- ==============================================================
INSERT INTO public.services (
        slug,
        title,
        short_description,
        description,
        price,
        duration,
        is_visible,
        icon
    )
VALUES (
        'tarot',
        'Sesión de Tarot',
        'Explorá tu pasado, presente y futuro a través de las cartas',
        'Las cartas del tarot son una herramienta ancestral que permite explorar el pasado, presente y futuro. En tu sesión, sumergiremos en los arquetipos y símbolos para guiarte en tus decisiones y revelar lo que el universo tiene preparado para ti.',
        5000,
        60,
        true,
        'tarot'
    ),
    (
        'buzios',
        'Sesión de Buzios',
        'Conexión con los orishas para recibir mensajes divinos',
        'Los buzios son conchas sagradas utilizadas en la religión de origen africano para comunicarse con los orishas y recibir mensajes divinos. Esta sesión te conectará con la sabiduría ancestral para resolver tus preguntas y conflictos.',
        6000,
        90,
        true,
        'buzios'
    ),
    (
        'limpieza-energetica',
        'Limpieza Energética',
        'Liberá tu espacio de energías negativas',
        'Las energías negativas pueden acumularse en nuestro alrededor y afectar nuestra vida cotidiana. A través de rituales sagrados y técnicas ancestrales, liberaremos tu espacio de esas energías para que puedas fluir con mayor claridad y bienestar.',
        8000,
        120,
        true,
        'energy'
    ),
    (
        'velomancia',
        'Velomancia',
        'Lee la luz de las velas para recibir mensajes del más allá',
        'La velomancia es el arte de leer la luz de las velas para revelar mensajes del más allá. Esta práctica ancestral te permitirá recibir respuestas de tus seres queridos que ya no están físicamente, y encontrar paz en momentos de duda.',
        7000,
        75,
        true,
        'candle'
    );