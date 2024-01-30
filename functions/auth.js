addEventListener('fetch', event => {
    event.respondWith(handleAuthenticationRequest(event.request))
  })
async function handleAuthenticationRequest(request) {
    const jwtKey = "UNdfDGCc10ItG8WasIPmQLjdAY30tP88RT6/viWpKg7UnwbG4/lQ2MvVMvFd6MzvPzgrznIwPi5Jr/QhC/8K9Q==";

    const cookieHeader = request.headers.get('Cookie');

    if (!cookieHeader) {
        return new Response("No token provided", { status: 400 });
    }

    const token = extractTokenFromCookie(cookieHeader);

    if (!token) {
        return new Response("Invalid token format", { status: 400 });
    }

    // Verify JWT Token
    const isValid = await verifyToken(token, jwtKey);

    if (isValid) {
        return new Response("Valid token", { status: 200 });
    } else {
        return new Response("Expired or Invalid token", { status: 401 });
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
