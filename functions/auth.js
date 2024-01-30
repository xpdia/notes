addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Check if the "token" cookie exists
  const token = getCookie(request, 'token')

  if (token) {
    // If the "token" cookie exists, return a success message
    return new Response(JSON.stringify({ success: true, message: 'Token found' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } else {
    // If the "token" cookie doesn't exist, return an error message
    return new Response(JSON.stringify({ success: false, message: 'Token not found' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';')
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=')
      if (cookieName.trim() === name) {
        return cookieValue
      }
    }
  }
  return null
}
