addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.pathname.endsWith('/auth')) {
        event.respondWith(handleAuthenticationRequest(event.request));
    } else if (event.request.method === 'OPTIONS') {
        event.respondWith(handlePreflightRequest(event.request));
    } else if (url.pathname === '/login' && event.request.method === 'POST') {
        event.respondWith(handleLoginRequest(event.request));
    } else {
        event.respondWith(fetch(event.request));
    }
});

async function handleAuthenticationRequest(request) {
    const jwtKey = "UNdfDGCc10ItG8WasIPmQLjdAY30tP88RT6/viWpKg7UnwbG4/lQ2MvVMvFd6MzvPzgrznIwPi5Jr/QhC/8K9Q==";

    const cookieHeader = request.headers.get('Cookie');

    if (!cookieHeader) {
        return new Response("No token provided", {
            status: 400, headers: {
                'Access-Control-Allow-Origin': 'https://my-notes.pages.dev',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    }

    const token = extractTokenFromCookie(cookieHeader);

    if (!token) {
        return new Response("Invalid token format", {
            status: 400, headers: {
                'Access-Control-Allow-Origin': 'https://my-notes.pages.dev',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    }

    // Verify JWT Token
    const isValid = await verifyToken(token, jwtKey);

    if (isValid) {
        return new Response("Valid token", {
            status: 200, headers: {
                'Access-Control-Allow-Origin': 'https://my-notes.pages.dev',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    } else {
        return new Response("Expired or Invalid token", {
            status: 401, headers: {
                'Access-Control-Allow-Origin': 'https://my-notes.pages.dev',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    }
}



async function handlePreflightRequest(request) {
    const headers = new Headers({
        'Access-Control-Allow-Origin': 'https://my-notes.pages.dev', // Replace with the actual origin
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    });

    return new Response(null, {
        headers: headers
    });
}

async function handleLoginRequest(request) {
    const requestBody = await request.text();
    const params = new URLSearchParams(requestBody);
    const username = params.get('username');
    const password = params.get('password');

    if (username === 'user' && password === 'pass') {
        const jwtToken = await generateJWTToken();
        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const expiryString = expiryDate.toUTCString();

        const responseBody = JSON.stringify({ message: 'Token added to cookie successfully', token: jwtToken });
        const response = new Response(responseBody);
        response.headers.set('Content-Type', 'application/json');
        response.headers.append('Set-Cookie', `token=${jwtToken}; HttpOnly; Secure; Expires=${expiryString}`);
        response.headers.set('Access-Control-Allow-Origin', 'https://my-notes.pages.dev');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        return response;
    } else {
        return new Response('Unauthorized', { status: 401 });
    }
}

function extractTokenFromCookie(cookieHeader) {
    const cookies = cookieHeader.split(';');

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();

        if (trimmedCookie.startsWith('token=')) {
            return trimmedCookie.substring('token='.length);
        }
    }

    return '';
}

async function verifyToken(token, jwtKey) {
    const [encodedHeader, encodedPayload, signatureBase64] = token.split('.');

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const data = new TextEncoder().encode(encodedHeader + "." + encodedPayload);
    const signature = new Uint8Array(atob(signatureBase64).split('').map(c => c.charCodeAt(0)));

    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);

    if (!isValid) {
        return false;
    }

    const payload = JSON.parse(atob(encodedPayload));

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
}

async function generateJWTToken() {
    const jwtKey = "UNdfDGCc10ItG8WasIPmQLjdAY30tP88RT6/viWpKg7UnwbG4/lQ2MvVMvFd6MzvPzgrznIwPi5Jr/QhC/8K9Q==";
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = currentTime + 3600;

    const payload = {
        exp: expirationTime,
        // Add other claims as needed
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const data = new TextEncoder().encode(encodedHeader + "." + encodedPayload);
    const signature = await crypto.subtle.sign("HMAC", key, data);

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const jwtToken = encodedHeader + '.' + encodedPayload + '.' + signatureBase64;

    return jwtToken;
}
