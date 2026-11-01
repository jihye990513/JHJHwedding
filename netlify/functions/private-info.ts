import { withLambda } from '@netlify/aws-lambda-compat';
import type { HandlerEvent } from '@netlify/aws-lambda-compat';

// CORS 허용 도메인
const ALLOWED_ORIGINS = [
    'https://jhjh-wedding.netlify.app',
    'http://localhost:3000'
];

export default withLambda(async (event: HandlerEvent) => {
    const origin = event.headers.origin || '';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
    };

    if (ALLOWED_ORIGINS.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                error: 'Method not allowed'
            })
        };
    }

    const privateInfo = {
        groom: {
            name: process.env.PRIVATE_GROOM_NAME || '신랑',
            firstName: process.env.PRIVATE_GROOM_FIRST_NAME || '신랑',
            phone: process.env.PRIVATE_GROOM_PHONE || '',
            parents: {
                father: {
                    name: process.env.PRIVATE_GROOM_FATHER_NAME || '',
                    phone: process.env.PRIVATE_GROOM_FATHER_PHONE || ''
                },
                mother: {
                    name: process.env.PRIVATE_GROOM_MOTHER_NAME || '',
                    phone: process.env.PRIVATE_GROOM_MOTHER_PHONE || ''
                },
                relation: '아들'
            }
        },

        bride: {
            name: process.env.PRIVATE_BRIDE_NAME || '신부',
            firstName: process.env.PRIVATE_BRIDE_FIRST_NAME || '신부',
            phone: process.env.PRIVATE_BRIDE_PHONE || '',
            parents: {
                father: {
                    name: process.env.PRIVATE_BRIDE_FATHER_NAME || '',
                    phone: process.env.PRIVATE_BRIDE_FATHER_PHONE || ''
                },
                mother: {
                    name: process.env.PRIVATE_BRIDE_MOTHER_NAME || '',
                    phone: process.env.PRIVATE_BRIDE_MOTHER_PHONE || ''
                },
                relation: '딸'
            }
        },

        accounts: {
            groom: [
                {
                    bank: process.env.PRIVATE_GROOM_BANK || '은행',
                    name: process.env.PRIVATE_GROOM_NAME || '신랑',
                    num: process.env.PRIVATE_GROOM_ACCOUNT || ''
                },
                {
                    bank: process.env.PRIVATE_GROOM_FATHER_BANK || '은행',
                    name:
                        process.env.PRIVATE_GROOM_FATHER_NAME ||
                        '신랑 아버지',
                    num: process.env.PRIVATE_GROOM_FATHER_ACCOUNT || ''
                },
                {
                    bank: process.env.PRIVATE_GROOM_MOTHER_BANK || '은행',
                    name:
                        process.env.PRIVATE_GROOM_MOTHER_NAME ||
                        '신랑 어머니',
                    num: process.env.PRIVATE_GROOM_MOTHER_ACCOUNT || ''
                }
            ],

            bride: [
                {
                    bank: process.env.PRIVATE_BRIDE_BANK || '은행',
                    name: process.env.PRIVATE_BRIDE_NAME || '신부',
                    num: process.env.PRIVATE_BRIDE_ACCOUNT || ''
                },
                {
                    bank: process.env.PRIVATE_BRIDE_FATHER_BANK || '은행',
                    name:
                        process.env.PRIVATE_BRIDE_FATHER_NAME ||
                        '신부 아버지',
                    num: process.env.PRIVATE_BRIDE_FATHER_ACCOUNT || ''
                },
                {
                    bank: process.env.PRIVATE_BRIDE_MOTHER_BANK || '은행',
                    name:
                        process.env.PRIVATE_BRIDE_MOTHER_NAME ||
                        '신부 어머니',
                    num: process.env.PRIVATE_BRIDE_MOTHER_ACCOUNT || ''
                }
            ]
        },

        images: {
            hero: process.env.PRIVATE_IMAGE_HERO || '',
            gallery: [
                process.env.PRIVATE_IMAGE_GALLERY_1 || '',
                process.env.PRIVATE_IMAGE_GALLERY_2 || '',
                process.env.PRIVATE_IMAGE_GALLERY_3 || '',
                process.env.PRIVATE_IMAGE_GALLERY_4 || '',
                process.env.PRIVATE_IMAGE_GALLERY_5 || '',
                process.env.PRIVATE_IMAGE_GALLERY_6 || '',
                process.env.PRIVATE_IMAGE_GALLERY_7 || '',
                process.env.PRIVATE_IMAGE_GALLERY_8 || '',
                process.env.PRIVATE_IMAGE_GALLERY_9 || '',
                process.env.PRIVATE_IMAGE_GALLERY_10 || ''
            ].filter((url) => url !== ''),
            closing: process.env.PRIVATE_IMAGE_CLOSING || ''
        }
    };

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(privateInfo)
    };
});