addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const cookieHeader = request.headers.get('Cookie');

    if (cookieHeader && cookieHeader.includes('token=')) {
        const tokenCookie = extractCookieValue(cookieHeader, 'token');

        try {
            const jwtKey = "UNdfDGCc10ItG8WasIPmQLjdAY30tP88RT6/viWpKg7UnwbG4/lQ2MvVMvFd6MzvPzgrznIwPi5Jr/QhC/8K9Q==";
            const isTokenValid = await verifyToken(tokenCookie, jwtKey);

            if (isTokenValid) {
                return new Response('{"success": true}', {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        } catch (error) {
            console.error('Error verifying token:', error);
        }
    }

    return new Response('{"success": false}', {
        headers: { 'Content-Type': 'application/json' },
    });
}

function extractCookieValue(cookieHeader, cookieName) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName) {
            return value;
        }
    }
    return null;
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
