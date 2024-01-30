addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Get the value to be added to the KV store
  const dataToAdd = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDY0Mzg3Mjl9.PjoivWqq+/pbGRdgYoSc0ihv08+kHl/9V+ztBQE5Lwk="; // Replace with your actual data to be added

  const date = new Date();
  const monthYearKey = `${date.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;

  try {
    // Check if the month-year key exists in KV store
    let existingData = await myKV.get(monthYearKey);
    const timestamp = Date.now();

    if (existingData) {
      // If the data for the month already exists, update it with the new value using the timestamp as the key
      let decodedData = atob(existingData); // Decode the existing data
      let newData = JSON.parse(decodedData);
      newData[timestamp] = dataToAdd;
      let encodedData = btoa(JSON.stringify(newData)); // Encode the updated data
      // Update the KV with the updated data
      await myKV.put(monthYearKey, encodedData);
    } else {
      // If the month-year key doesn't exist, create a new entry for it using the timestamp as the key
      const timestamp = Date.now();
      let newData = { [timestamp]: dataToAdd };
      let encodedData = btoa(JSON.stringify(newData)); // Encode the new data
      // Add the new data to the KV store
      await myKV.put(monthYearKey, encodedData);
    }

    // Respond with a success message
    return new Response(`Data added/updated in KEY: ${timestamp} for month ${monthYearKey}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    // Handle errors, e.g., if there's an issue adding data to the KV store
    return new Response(`Error adding/updating data to KV store: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
