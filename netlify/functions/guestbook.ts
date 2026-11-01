import type { Handler } from '@netlify/functions';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
    randomBytes,
    scryptSync,
    timingSafeEqual,
    createHash
} from 'node:crypto';

const COLLECTION = 'guestbook';
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
};

function reply(statusCode: number, data: unknown) {
    return {
        statusCode,
        headers,
        body: JSON.stringify(data)
    };
}

function getDatabase() {
    const appName = 'guestbook-server';
    let app = getApps().find((item) => item.name === appName);

    if (!app) {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (!raw) {
            throw new Error('Firebase server configuration missing');
        }

        const credentials = JSON.parse(raw);

        app = initializeApp(
            {
                credential: cert({
                    projectId: credentials.project_id,
                    clientEmail: credentials.client_email,
                    privateKey: credentials.private_key
                })
            },
            appName
        );
    }

    return getFirestore(app);
}

function makeHash(password: string, salt: string) {
    return scryptSync(password, salt, 64);
}

export const handler: Handler = async (event) => {
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return reply(405, { error: '지원하지 않는 요청입니다.' });
    }

    try {
        const db = getDatabase();

        // 목록에는 비밀번호와 해시를 포함하지 않음
        if (event.httpMethod === 'GET') {
            const snapshot = await db
                .collection(COLLECTION)
                .orderBy('createdAt', 'desc')
                .limit(200)
                .get();

            const entries = snapshot.docs.map((item) => {
                const data = item.data();

                return {
                    id: item.id,
                    name: data.name,
                    message: data.message,
                    createdAt:
                        data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate().toISOString()
                            : null
                };
            });

            return reply(200, { entries });
        }

        if (event.body && Buffer.byteLength(event.body, 'utf8') > 8192) {
            return reply(413, { error: '입력 내용이 너무 깁니다.' });
        }

        let body: Record<string, unknown>;

        try {
            body = JSON.parse(event.body || '{}');

            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                return reply(400, { error: '잘못된 요청입니다.' });
            }
        } catch {
            return reply(400, { error: '잘못된 요청입니다.' });
        }

        const action = body.action;

        if (!['create', 'verify', 'update', 'delete'].includes(String(action))) {
            return reply(400, { error: '잘못된 요청입니다.' });
        }

        const password =
            typeof body.password === 'string' ? body.password : '';

        if (!/^\d{4}$/.test(password)) {
            return reply(400, {
                error: '비밀번호는 숫자 4자리로 입력해주세요.'
            });
        }

        const message =
            typeof body.message === 'string' ? body.message.trim() : '';

        if (
            (action === 'create' || action === 'update') &&
            (!message || message.length > 200)
        ) {
            return reply(400, {
                error: '메시지는 1~200자로 입력해주세요.'
            });
        }

        const name =
            typeof body.name === 'string' ? body.name.trim() : '';

        if (action === 'create' && (!name || name.length > 30)) {
            return reply(400, {
                error: '이름은 1~30자로 입력해주세요.'
            });
        }

        const id = typeof body.id === 'string' ? body.id : '';

        if (action !== 'create' && !/^[a-zA-Z0-9]{20}$/.test(id)) {
            return reply(400, { error: '잘못된 글 번호입니다.' });
        }

        // Netlify가 제공하는 접속 IP를 해시하여 요청 횟수 제한
        const clientIp =
            event.headers['x-nf-client-connection-ip'] || 'unknown';

        const ipHash = createHash('sha256')
            .update(clientIp)
            .digest('hex');

        const rateRef = db.collection('_guestbook_rate_limits').doc(ipHash);

        const allowed = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(rateRef);
            const data = snapshot.data();
            const now = Date.now();
            const startedAt = data?.startedAt?.toMillis?.() || 0;
            const isCurrentWindow = now - startedAt < 60_000;
            const count = isCurrentWindow ? Number(data?.count || 0) : 0;

            if (count >= 10) return false;

            transaction.set(rateRef, {
                startedAt: isCurrentWindow
                    ? Timestamp.fromMillis(startedAt)
                    : Timestamp.fromMillis(now),
                count: count + 1
            });

            return true;
        });

        if (!allowed) {
            return reply(429, {
                error: '요청이 많습니다. 1분 후 다시 시도해주세요.'
            });
        }

        if (action === 'create') {
            const salt = randomBytes(16).toString('hex');
            const passwordHash = makeHash(password, salt).toString('hex');

            const newEntry = await db.collection(COLLECTION).add({
                name,
                message,
                salt,
                passwordHash,
                createdAt: Timestamp.now(),
                failedAttempts: 0,
                lockedUntil: Timestamp.fromMillis(0)
            });

            return reply(201, { success: true, id: newEntry.id });
        }

        const entryRef = db.collection(COLLECTION).doc(id);

        const result = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(entryRef);

            if (!snapshot.exists) {
                return {
                    status: 404,
                    error: '이미 삭제되었거나 존재하지 않는 글입니다.'
                };
            }

            const data = snapshot.data()!;
            const now = Date.now();
            const lockedUntil = data.lockedUntil?.toMillis?.() || 0;

            if (lockedUntil > now) {
                return {
                    status: 429,
                    error: '비밀번호 확인 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
                };
            }

            const enteredHash = makeHash(password, data.salt);
            const savedHash = Buffer.from(data.passwordHash, 'hex');

            const matches =
                enteredHash.length === savedHash.length &&
                timingSafeEqual(enteredHash, savedHash);

            if (!matches) {
                const previousAttempts =
                    lockedUntil > 0 ? 0 : Number(data.failedAttempts || 0);

                const attempts = previousAttempts + 1;
                const isLocked = attempts >= MAX_ATTEMPTS;

                transaction.update(entryRef, {
                    failedAttempts: isLocked ? 0 : attempts,
                    lockedUntil: Timestamp.fromMillis(
                        isLocked ? now + LOCK_TIME : 0
                    )
                });

                return {
                    status: isLocked ? 429 : 403,
                    error: isLocked
                        ? '비밀번호 확인 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
                        : '비밀번호가 일치하지 않습니다.'
                };
            }

            if (action === 'delete') {
                transaction.delete(entryRef);
            } else {
                transaction.update(entryRef, {
                    ...(action === 'update'
                        ? { message, updatedAt: Timestamp.now() }
                        : {}),
                    failedAttempts: 0,
                    lockedUntil: Timestamp.fromMillis(0)
                });
            }

            return { status: 200, error: null };
        });

        if (result.error) {
            return reply(result.status, { error: result.error });
        }

        return reply(200, { success: true });
    } catch {
        // 서버 인증정보나 요청의 비밀번호를 로그에 남기지 않음
        console.error('Guestbook server request failed');

        return reply(500, {
            error: '방명록을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
        });
    }
};