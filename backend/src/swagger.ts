// @ts-ignore
import swaggerJsdoc, { OAS3Definition, OAS3Options } from 'swagger-jsdoc';

const definition: OAS3Definition = {
    openapi: '3.0.3',
    info: {
        title: 'Poll API',
        version: '1.0.0',
        description: 'Документація API для опитувань (PollApp). Опис українською мовою.',
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Локальний сервер' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['user', 'admin'] },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Survey: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    question: { type: 'string' },
                    options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' } } } },
                    publicId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            OptionResult: {
                type: 'object',
                properties: {
                    optionId: { type: 'string' },
                    text: { type: 'string' },
                    votesCount: { type: 'number' },
                    percentage: { type: 'number' },
                },
            },
            ResultsPublic: {
                type: 'object',
                properties: {
                    surveyId: { type: 'string' },
                    publicId: { type: 'string' },
                    question: { type: 'string' },
                    totalVotes: { type: 'number' },
                    options: { type: 'array', items: { $ref: '#/components/schemas/OptionResult' } },
                },
            },
            CompletedSurvey: {
                type: 'object',
                properties: {
                    surveyId: { type: 'string', description: 'Унікальний ідентифікатор опитування' },
                    publicId: { type: 'string', description: 'Публічний ідентифікатор опитування' },
                    question: { type: 'string', description: 'Питання опитування' },
                    completedAt: { type: 'string', format: 'date-time', description: 'Дата та час проходження опитування' },
                    selectedOption: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Ідентифікатор обраної опції' },
                            text: { type: 'string', description: 'Текст обраної опції' },
                        },
                        description: 'Обрана користувачем опція'
                    },
                },
            },
            UserCompletedSurveysResponse: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'Ідентифікатор користувача' },
                    userEmail: { type: 'string', description: 'Електронна пошта користувача' },
                    totalCompletedSurveys: { type: 'number', description: 'Загальна кількість пройдених опитувань' },
                    surveys: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CompletedSurvey' },
                        description: 'Список пройдених опитувань'
                    },
                },
            },
            SurveyListItem: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Унікальний ідентифікатор опитування' },
                    publicId: { type: 'string', description: 'Публічний ідентифікатор опитування' },
                    question: { type: 'string', description: 'Питання опитування' },
                    createdAt: { type: 'string', format: 'date-time', description: 'Дата створення опитування' },
                    totalVotes: { type: 'number', description: 'Загальна кількість голосів' },
                    hasVoted: { type: 'boolean', description: 'Чи проголосував поточний користувач' },
                    votedAt: { type: 'string', format: 'date-time', nullable: true, description: 'Дата голосування користувача (якщо голосував)' },
                },
            },
            SurveyOption: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Унікальний ідентифікатор опції' },
                    text: { type: 'string', description: 'Текст опції' },
                },
                required: ['id', 'text']
            },
        },
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/api/health': {
            get: {
                summary: 'Перевірка стану API',
                description: 'Повертає `{ ok: true }`, щоб перевірити доступність сервера.',
                responses: {
                    '200': {
                        description: 'Сервер працює коректно',
                        content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } },
                    },
                },
            },
        },
        '/api/auth/register': {
            post: {
                summary: 'Реєстрація користувача',
                description: 'Створює нового користувача за email та паролем.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', description: 'Електронна пошта' },
                                    password: { type: 'string', description: 'Пароль' },
                                },
                                required: ['email', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Користувача успішно створено' },
                    '400': { description: 'Некоректні дані або користувач вже існує' },
                },
            },
        },
        '/api/auth/login': {
            post: {
                summary: 'Вхід користувача',
                description: 'Повертає JWT токен за валідними даними входу.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string' },
                                    password: { type: 'string' },
                                },
                                required: ['email', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Успішний вхід, повернено токен' },
                    '401': { description: 'Невірний email або пароль' },
                },
            },
        },
        '/api/users/me': {
            get: {
                summary: 'Поточний користувач',
                description: 'Повертає дані авторизованого користувача. Потрібен JWT.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Дані користувача', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                    '401': { description: 'Немає авторизації' },
                },
            },
        },
        '/api/users/change-password': {
            put: {
                summary: 'Зміна паролю',
                description: 'Зміня пароль поточного авторизованого користувача. Потрібен поточний пароль для підтвердження.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    currentPassword: { 
                                        type: 'string', 
                                        description: 'Поточний пароль користувача',
                                        minLength: 1
                                    },
                                    newPassword: { 
                                        type: 'string',
                                        description: 'Новий пароль (мінімум 8 символів, має містити великі і малі літери, цифри, спеціальні символи)',
                                        minLength: 8,
                                        maxLength: 50,
                                        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
                                    },
                                },
                                required: ['currentPassword', 'newPassword'],
                                example: {
                                    currentPassword: 'OldPassword123!',
                                    newPassword: 'NewPassword456@'
                                }
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Пароль успішно змінено',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', description: 'Повідомлення про успіх' },
                                        success: { type: 'boolean', description: 'Позначка успіху' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { 
                        description: 'Некоректні дані або невірний поточний пароль',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '401': { description: 'Відсутня авторизація' },
                    '404': { description: 'Користувача не знайдено' },
                },
            },
        },
        '/api/surveys': {
            get: {
                summary: 'Список опитувань (адмін)',
                description: 'Повертає всі опитування. Доступ лише для адміністратора.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Список опитувань', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Survey' } } } } },
                    '403': { description: 'Недостатньо прав' },
                },
            },
            post: {
                summary: 'Створення опитування (адмін)',
                description: 'Створює нове опитування з варіантами. Доступ лише для адміністратора.',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    question: { type: 'string', minLength: 5, maxLength: 300, description: 'Питання опитування' },
                                    options: { 
                                        type: 'array', 
                                        items: { type: 'string', minLength: 1, maxLength: 100 }, 
                                        minItems: 2, 
                                        maxItems: 10, 
                                        description: 'Варіанти відповідей' 
                                    },
                                },
                                required: ['question', 'options'],
                                example: {
                                    question: "string",
                                    options: [
                                        "string",
                                        "string", 
                                        "string"
                                    ]
                                }
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Опитування створено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Survey' } } } },
                    '400': { description: 'Некоректні дані' },
                    '403': { description: 'Недостатньо прав' },
                },
            },
        },
        '/api/surveys/list': {
            get: {
                summary: 'Список опитувань для користувачів',
                description: 'Повертає список всіх доступних опитувань з інформацією про те, чи проголосував поточний користувач. Доступний для всіх авторизованих користувачів.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Список опитувань з інформацією про статус голосування',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/SurveyListItem' }
                                }
                            }
                        }
                    },
                    '401': { description: 'Відсутня авторизація' },
                },
            },
        },
        '/api/surveys/my/completed': {
            get: {
                summary: 'Мої пройдені опитування',
                description: 'Повертає список всіх опитувань, які пройшов поточний авторизований користувач, з інформацією про обрані відповіді та дати проходження.',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Список пройдених користувачем опитувань',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserCompletedSurveysResponse' }
                            }
                        }
                    },
                    '401': { description: 'Відсутня авторизація' },
                },
            },
        },
        '/api/surveys/user/{userId}/completed': {
            get: {
                summary: 'Опитування, пройдені користувачем (адмін)',
                description: 'Повертає список всіх опитувань, які пройшов вказаний користувач, з інформацією про обрані відповіді та дати проходження. Доступ лише для адміністратора.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { 
                        name: 'userId', 
                        in: 'path', 
                        required: true, 
                        schema: { type: 'string' }, 
                        description: 'Унікальний ідентифікатор користувача' 
                    },
                ],
                responses: {
                    '200': {
                        description: 'Список пройдених користувачем опитувань',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserCompletedSurveysResponse' }
                            }
                        }
                    },
                    '404': { description: 'Користувача не знайдено' },
                    '403': { description: 'Недостатньо прав доступу' },
                    '401': { description: 'Відсутня авторизація' },
                },
            },
        },
        '/api/surveys/{id}': {
            get: {
                summary: 'Опитування за ID (адмін)',
                description: 'Повертає деталі опитування за внутрішнім ID. Доступ лише для адміністратора.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Внутрішній ID опитування' },
                ],
                responses: {
                    '200': { description: 'Деталі опитування', content: { 'application/json': { schema: { $ref: '#/components/schemas/Survey' } } } },
                    '404': { description: 'Опитування не знайдено' },
                    '403': { description: 'Недостатньо прав' },
                },
            },
            put: {
                summary: 'Оновлення опитування (адмін)',
                description: 'Оновлює опитування за внутрішнім ID. Можливо лише для опитувань, в яких ще немає голосів. Доступ лише для адміністратора.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Внутрішній ID опитування' },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    question: { type: 'string', minLength: 5, maxLength: 300, description: 'Питання опитування' },
                                    options: { 
                                        type: 'array',
                                        minItems: 2,
                                        maxItems: 10,
                                        items: {
                                            oneOf: [
                                                {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string', description: 'ID існуючої опції (опціонально для нових)' },
                                                        text: { type: 'string', minLength: 1, maxLength: 100, description: 'Текст опції' }
                                                    },
                                                    required: ['text'],
                                                    additionalProperties: false
                                                },
                                                {
                                                    type: 'string',
                                                    minLength: 1,
                                                    maxLength: 100,
                                                    description: 'Текст нової опції'
                                                }
                                            ]
                                        },
                                        description: 'Варіанти відповіді. Можна передати як рядки для нових опцій, або об\'єкти з ID для існуючих'
                                    },
                                },
                                required: ['question', 'options'],
                                example: {
                                    question: 'Оновлене питання опитування?',
                                    options: [
                                        { id: 'existing-option-1', text: 'Оновлений текст існуючої опції' },
                                        { text: 'Нова опція без ID' },
                                        'Ще одна нова опція (спрощений формат)'
                                    ]
                                }
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Опитування успішно оновлено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Survey' } } } },
                    '400': { description: 'Некоректні дані' },
                    '403': { description: 'Недостатньо прав' },
                    '404': { description: 'Опитування не знайдено' },
                    '409': { 
                        description: 'Неможливо оновити опитування з існуючими голосами',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' },
                                        message: { type: 'string' },
                                        totalVotes: { type: 'number' }
                                    }
                                }
                            }
                        }
                    },
                },
            },
            delete: {
                summary: 'Видалення опитування (адмін)',
                description: 'Видаляє опитування за внутрішнім ID та повʼязані голоси. Доступ лише для адміністратора.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Внутрішній ID опитування' },
                ],
                responses: {
                    '204': { description: 'Опитування успішно видалено (без тіла відповіді)' },
                    '404': { description: 'Опитування не знайдено' },
                    '403': { description: 'Недостатньо прав' },
                },
            },
        },
        '/api/surveys/public/{publicId}': {
            get: {
                summary: 'Публічне опитування за publicId',
                description: 'Повертає публічну інформацію про опитування для перегляду та голосування.',
                parameters: [
                    { name: 'publicId', in: 'path', required: true, schema: { type: 'string' }, description: 'Публічний ID опитування' },
                ],
                responses: {
                    '200': { description: 'Публічні дані опитування', content: { 'application/json': { schema: { $ref: '#/components/schemas/Survey' } } } },
                    '404': { description: 'Опитування не знайдено' },
                },
            },
        },
        '/api/surveys/public/{publicId}/vote': {
            post: {
                summary: 'Голосування у публічному опитуванні',
                description: 'Приймає голос користувача за один із варіантів. Потрібен JWT (користувач має бути авторизований).',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'publicId', in: 'path', required: true, schema: { type: 'string' }, description: 'Публічний ID опитування' },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    optionId: { type: 'string', description: 'ID обраного варіанту' },
                                },
                                required: ['optionId'],
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Голос прийнято' },
                    '400': { description: 'Некоректні дані' },
                    '401': { description: 'Потрібна авторизація' },
                    '409': { description: 'Користувач вже голосував' },
                    '404': { description: 'Опитування не знайдено' },
                },
            },
        },
        '/api/surveys/public/{publicId}/results': {
            get: {
                summary: 'Результати публічного опитування',
                description: 'Повертає агреговані результати голосування. Потрібен JWT.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'publicId', in: 'path', required: true, schema: { type: 'string' }, description: 'Публічний ID опитування' },
                ],
                responses: {
                    '200': { description: 'Результати опитування', content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultsPublic' } } } },
                    '401': { description: 'Потрібна авторизація' },
                    '404': { description: 'Опитування не знайдено' },
                },
            },
        },
    },
};

const options: OAS3Options = {
    definition,
    apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
